import { Injectable, signal } from '@angular/core';
import { collection, deleteDoc, doc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { firebaseFunctions, firestore } from '../../core/services/firebase-config';
import { ResourceTopic, ResourceTopicLink, defaultTopics } from './resource-needs';
import { TOPIC_DRAFTS } from './resource-topic-drafts';

/** What the drafting assistant returns (links it could not open are flagged). */
export interface TopicDraftResult {
  intro: string;
  tips: string[];
  links: (ResourceTopicLink & { checked: boolean })[];
}

/**
 * "Search by Category" topics (resourceTopics/{key}). Until an admin saves
 * topics, the built-in list is used, so the public page always has topics.
 */
@Injectable({ providedIn: 'root' })
export class ResourceTopicService {
  private readonly topicsCollection = collection(firestore, 'resourceTopics');

  /** Active topics in order, for the public pages. Filled by load(). */
  readonly topics = signal<ResourceTopic[]>(defaultTopics());
  /** True once topics were read from Firestore (saved ones or none). */
  readonly fromDatabase = signal(false);

  private loading: Promise<void> | null = null;

  /** Reads the topics once per visit (force after an admin change). */
  load(force = false): Promise<void> {
    if (force) {
      this.loading = null;
    }
    this.loading ??= this.listAll()
      .then((all) => {
        if (all.length) {
          this.topics.set(all.filter((topic) => topic.active));
          this.fromDatabase.set(true);
        } else {
          this.topics.set(defaultTopics());
          this.fromDatabase.set(false);
        }
      })
      .catch((error) => {
        console.error('Failed to load topics:', error);
        this.loading = null;
      });
    return this.loading;
  }

  /** Every saved topic, including hidden ones, in order. */
  async listAll(): Promise<ResourceTopic[]> {
    const snapshot = await getDocs(this.topicsCollection);
    return snapshot.docs
      .map((item) => this.normalize(item.id, item.data()))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }

  async save(topic: ResourceTopic, uid: string): Promise<void> {
    const clean = this.clean(topic);
    await setDoc(doc(this.topicsCollection, clean.key), { ...clean, updatedBy: uid, updatedAt: serverTimestamp() });
  }

  /** Saves the order of several topics at once. */
  async saveOrder(topics: ResourceTopic[], uid: string): Promise<void> {
    const batch = writeBatch(firestore);
    topics.forEach((topic, index) => {
      batch.set(doc(this.topicsCollection, topic.key), { ...this.clean({ ...topic, order: index }), updatedBy: uid, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }

  /**
   * Adds Zebron's drafted introduction, tips and links to saved topics that
   * have none yet. Returns how many topics were filled.
   */
  async fillDrafts(topics: ResourceTopic[], uid: string): Promise<number> {
    const batch = writeBatch(firestore);
    let filled = 0;
    for (const topic of topics) {
      const draft = TOPIC_DRAFTS[topic.key];
      if (!draft || topic.intro || topic.tips.length || topic.links.length || !(draft.intro || draft.tips.length || draft.links.length)) {
        continue;
      }
      filled++;
      batch.set(doc(this.topicsCollection, topic.key), {
        ...this.clean({ ...topic, intro: draft.intro, tips: [...draft.tips], links: draft.links.map((link) => ({ ...link })) }),
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      });
    }
    if (filled) {
      await batch.commit();
    }
    return filled;
  }

  /** Asks the drafting assistant (Gemini, admins only) for a topic's content. */
  async draftWithAi(topic: Pick<ResourceTopic, 'title' | 'text' | 'keywords' | 'intro'>, area: string): Promise<TopicDraftResult> {
    const callable = httpsCallable<
      { title: string; text: string; keywords: string[]; intro: string; area: string },
      TopicDraftResult
    >(firebaseFunctions, 'draftTopicContent');
    const result = await callable({ title: topic.title, text: topic.text, keywords: topic.keywords, intro: topic.intro, area });
    return result.data;
  }

  async remove(key: string): Promise<void> {
    await deleteDoc(doc(this.topicsCollection, key));
  }

  /** Saves the built-in topics so admins can edit them. */
  async seedDefaults(uid: string): Promise<void> {
    await this.saveOrder(defaultTopics(), uid);
  }

  // ----------------------------------------------------------

  private normalize(id: string, data: Record<string, unknown>): ResourceTopic {
    const value = data as Partial<ResourceTopic>;
    const list = (items: unknown) => (Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string') : []);
    return {
      key: id,
      title: value.title ?? id,
      text: value.text ?? '',
      intro: value.intro ?? '',
      categoryIds: list(value.categoryIds),
      keywords: list(value.keywords),
      route: value.route ?? '',
      tips: list(value.tips),
      links: Array.isArray(value.links)
        ? (value.links as ResourceTopicLink[]).filter((link) => link && typeof link.label === 'string' && typeof link.url === 'string')
        : [],
      order: typeof value.order === 'number' ? value.order : 999,
      active: value.active !== false,
    };
  }

  private clean(topic: ResourceTopic): ResourceTopic {
    const list = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];
    return {
      key: topic.key.trim(),
      title: topic.title.trim(),
      text: topic.text.trim(),
      intro: topic.intro.trim(),
      categoryIds: list(topic.categoryIds),
      keywords: list(topic.keywords.map((word) => word.toLowerCase())),
      route: topic.route.trim(),
      tips: list(topic.tips),
      links: topic.links
        .map((link) => ({ label: link.label.trim(), url: link.url.trim() }))
        .filter((link) => link.label && link.url),
      order: topic.order,
      active: topic.active,
    };
  }
}
