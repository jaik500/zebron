import { Injectable, signal } from '@angular/core';
import { collection, doc, getDoc, getDocs, increment, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { firestore } from '../../core/services/firebase-config';
import { BootcampDetails, BootcampProgram, BootcampSummary, bootcampSummary, normalizeProgram, slugify } from './bootcamp.model';

/** Views and Apply clicks for one program (bootcampStats/{resourceId}__{programId}). */
export interface BootcampProgramStats {
  bootcampId: string;
  programId: string;
  views: number;
  applyClicks: number;
}

/** Program id used to count views of the whole resource page. */
export const PAGE_STATS_ID = '_page';

/**
 * Programs of bootcamp resources (bootcamps/{resourceId}). Anyone reads;
 * platform admins write.
 */
@Injectable({ providedIn: 'root' })
export class BootcampService {
  private readonly bootcamps = collection(firestore, 'bootcamps');

  /** Program summaries by resource id, for lists. Filled by loadSummaries(). */
  readonly summaries = signal<Map<string, BootcampSummary>>(new Map());
  private summariesLoad: Promise<void> | null = null;

  /** Loads every bootcamp's program summary once per visit (one small query). */
  loadSummaries(): Promise<void> {
    this.summariesLoad ??= this.listAll()
      .then((all) => {
        const map = new Map<string, BootcampSummary>();
        for (const details of all) {
          const summary = bootcampSummary(details.programs);
          if (summary) {
            map.set(details.resourceId, summary);
          }
        }
        this.summaries.set(map);
      })
      .catch((error) => {
        console.error('Failed to load bootcamp programs:', error);
        this.summariesLoad = null;
      });
    return this.summariesLoad;
  }

  /** The programs of one bootcamp resource, or null when none were added. */
  async get(resourceId: string): Promise<BootcampDetails | null> {
    const snapshot = await getDoc(doc(this.bootcamps, resourceId));
    return snapshot.exists() ? this.toDetails(snapshot.id, snapshot.data()) : null;
  }

  /** Every bootcamp's programs, for Admin → Bootcamps and the /bootcamps list. */
  async listAll(): Promise<BootcampDetails[]> {
    const snapshot = await getDocs(this.bootcamps);
    return snapshot.docs.map((item) => this.toDetails(item.id, item.data()));
  }

  async save(resourceId: string, programs: BootcampProgram[], uid: string): Promise<void> {
    await setDoc(doc(this.bootcamps, resourceId), {
      resourceId,
      programs: programs.map((program) => this.cleanProgram(program)),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
    this.summariesLoad = null;
  }

  // ----------------------------------------------------------
  // Views and Apply clicks (anyone may add one; admins read)
  // ----------------------------------------------------------

  /** Adds one view or Apply click. Never throws: counting must not break the page. */
  async record(resourceId: string, programId: string, kind: 'views' | 'applyClicks'): Promise<void> {
    const ref = doc(firestore, 'bootcampStats', `${resourceId}__${programId}`);
    try {
      await updateDoc(ref, { [kind]: increment(1) });
    } catch {
      try {
        // First count for this program.
        await setDoc(ref, {
          bootcampId: resourceId,
          programId,
          views: kind === 'views' ? 1 : 0,
          applyClicks: kind === 'applyClicks' ? 1 : 0,
        });
      } catch {
        // Ignore: a lost count is harmless.
      }
    }
  }

  async listStats(): Promise<BootcampProgramStats[]> {
    const snapshot = await getDocs(collection(firestore, 'bootcampStats'));
    return snapshot.docs.map((item) => item.data() as BootcampProgramStats);
  }

  // ----------------------------------------------------------

  private toDetails(id: string, data: Record<string, unknown>): BootcampDetails {
    const value = data as Partial<BootcampDetails>;
    return {
      resourceId: id,
      programs: (value.programs ?? []).map((program) => normalizeProgram(program)),
      updatedBy: value.updatedBy,
      updatedAt: value.updatedAt ?? null,
    };
  }

  /** Trims text and drops empty list items and start dates before saving. */
  private cleanProgram(program: BootcampProgram): BootcampProgram {
    const list = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
    return {
      ...program,
      id: program.id || slugify(program.title),
      title: program.title.trim(),
      summary: program.summary.trim(),
      costNote: program.costNote.trim(),
      prerequisites: program.prerequisites.trim(),
      workAuthorization: program.workAuthorization.trim(),
      outcomesSource: program.outcomesSource.trim(),
      applyUrl: program.applyUrl.trim(),
      zebronTake: program.zebronTake.trim(),
      certifications: list(program.certifications),
      skills: list(program.skills),
      starts: program.starts
        .filter((start) => /^\d{4}-\d{2}-\d{2}$/.test(start.date))
        .map((start) => (start.deadline && /^\d{4}-\d{2}-\d{2}$/.test(start.deadline) ? start : { date: start.date }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
