import { Injectable } from "@angular/core";

import { getApp } from "firebase/app";

import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

interface RecordCommunityPostViewResponse {
  recorded: boolean;
  viewCount: number;
}

@Injectable({
  providedIn: "root",
})
export class CommunityPostViewService {
  /**
   * Record a post view through the trusted backend.
   *
   * userId remains in the method signature to preserve the
   * existing caller. The backend derives the authoritative
   * user identity from Firebase Authentication.
   */
  async recordView(
    postId: string,
    userId: string,
  ): Promise<void> {
    const normalizedPostId = postId.trim();
    const normalizedUserId = userId.trim();

    if (!normalizedPostId || !normalizedUserId) {
      return;
    }

    const functions = getFunctions(
      getApp(),
      "us-central1",
    );

    const recordView = httpsCallable<
      { postId: string },
      RecordCommunityPostViewResponse
    >(
      functions,
      "recordCommunityPostView",
    );

    await recordView({
      postId: normalizedPostId,
    });
  }
}