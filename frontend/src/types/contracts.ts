import type {
  AddDownloadRequest as AddDownloadRequestModel,
  AppSnapshot as AppSnapshotModel,
  DownloadItem as DownloadItemModel,
  Notification as NotificationModel,
  Preferences as PreferencesModel,
  RemoveDownloadRequest as RemoveDownloadRequestModel,
} from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";

export type AddDownloadRequest = AddDownloadRequestModel;
export type AppSnapshot = AppSnapshotModel;
export type DownloadItem = DownloadItemModel;
export type Notification = NotificationModel;
export type Preferences = PreferencesModel;
export type RemoveDownloadRequest = RemoveDownloadRequestModel;

export type DownloadFilter = "all" | "active" | "waiting" | "paused" | "complete" | "error";

