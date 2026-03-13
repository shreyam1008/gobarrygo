import "@bindings/github.com/wailsapp/wails/v3/internal/eventcreate.js";
import { Events } from "@wailsio/runtime";
import * as Service from "@bindings/github.com/shreyam1008/gobarrygo/internal/api/service.js";
import {
  AddDownloadRequest,
  AppSnapshot,
  Notification,
  Preferences,
  RemoveDownloadRequest,
} from "@bindings/github.com/shreyam1008/gobarrygo/internal/contracts/models.js";

const SNAPSHOT_EVENT = "app:snapshot";
const NOTIFICATION_EVENT = "app:notification";

export type Unsubscribe = () => void | Promise<void>;

export async function bootstrap(): Promise<AppSnapshot> {
  return Service.Bootstrap();
}

export async function refresh(): Promise<AppSnapshot> {
  return Service.Refresh();
}

export async function savePreferences(input: Preferences): Promise<AppSnapshot> {
  return Service.SavePreferences(input);
}

export async function addDownload(input: AddDownloadRequest): Promise<AppSnapshot> {
  return Service.AddDownload(input);
}

export async function pauseDownload(gid: string): Promise<AppSnapshot> {
  return Service.PauseDownload(gid);
}

export async function resumeDownload(gid: string): Promise<AppSnapshot> {
  return Service.ResumeDownload(gid);
}

export async function retryDownload(gid: string): Promise<AppSnapshot> {
  return Service.RetryDownload(gid);
}

export async function removeDownload(input: RemoveDownloadRequest): Promise<AppSnapshot> {
  return Service.RemoveDownload(input);
}

export async function pauseAll(): Promise<AppSnapshot> {
  return Service.PauseAll();
}

export async function resumeAll(): Promise<AppSnapshot> {
  return Service.ResumeAll();
}

export async function openDownloadedFile(gid: string): Promise<void> {
  return Service.OpenDownloadedFile(gid);
}

export async function openDownloadFolder(gid: string): Promise<void> {
  return Service.OpenDownloadFolder(gid);
}

export async function openDownloadDirectory(): Promise<void> {
  return Service.OpenDownloadDirectory();
}

export async function pickDownloadDirectory(): Promise<string> {
  return Service.PickDownloadDirectory();
}

export async function pickAria2Binary(): Promise<string> {
  return Service.PickAria2Binary();
}

export async function revealPreferencesFile(): Promise<void> {
  return Service.RevealPreferencesFile();
}

export async function openWebsite(url: string): Promise<void> {
  return Service.OpenWebsite(url);
}

export function onSnapshot(listener: (snapshot: AppSnapshot) => void): Unsubscribe {
  return Events.On(SNAPSHOT_EVENT, (event) => {
    listener(event.data);
  });
}

export function onNotification(listener: (notification: Notification) => void): Unsubscribe {
  return Events.On(NOTIFICATION_EVENT, (event) => {
    listener(event.data);
  });
}
