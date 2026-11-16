# Course overview videos

A silent overview video (about 50 seconds) for each of the nine courses of the
Enterprise AI & Solutions Architecture program: what you will learn, the
modules, the skills, and the next course. Each course's first lesson opens
with its video.

    node scripts/course-videos/upload-course-videos.mjs            # dry run
    node scripts/course-videos/upload-course-videos.mjs --apply    # upload and add to the courses

Add `--renumber` to also set programOrder 1 to 9 on the courses.

The course seeds include the same video blocks, so re-running a seed keeps them.
To replace a video, keep its file name and token (manifest.json) and upload
again: the link in the course stays the same.
