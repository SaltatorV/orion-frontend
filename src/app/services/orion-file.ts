import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FileItem } from '../models/file-item.model';
import { PageResponse } from '../models/page-response.model';
import { HttpEvent } from '@angular/common/http';
import { DirectoryItem } from '../models/directory-item.model';
@Injectable({
  providedIn: 'root'
})
export class OrionFileService {

  private readonly apiUrl = '/api/files';

  constructor(private http: HttpClient) {}

  getFiles(
    directory: string,
    page = 0,
    size = 20,
    printed: boolean | null = null
  ): Observable<PageResponse<FileItem>> {
    let params = new HttpParams()
      .set('directory', directory)
      .set('page', page)
      .set('size', size);

    if (printed !== null) {
      params = params.set('printed', printed);
    }

    return this.http.get<PageResponse<FileItem>>(this.apiUrl, { params });
  }

  upload(file: File, directory: string): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new HttpParams().set('directory', directory);

    return this.http.post(`${this.apiUrl}/upload`, formData, {
      params,
      reportProgress: true,
      observe: 'events'
    });
  }

  delete(path: string): Observable<void> {
    const params = new HttpParams().set('path', path);

    return this.http.delete<void>(this.apiUrl, { params });
  }
  getFileUrl(path: string): string {
    return `/api/files/preview?path=${encodeURIComponent(path)}`;
  }

  getDownloadUrl(path: string): string {
    return `/api/files/download?path=${encodeURIComponent(path)}`;
  }

  getDirectories(path: string = ''): Observable<DirectoryItem[]> {
    const params = new HttpParams().set('path', path);
    return this.http.get<DirectoryItem[]>('/api/directories', { params });
  }

  createDirectory(path: string): Observable<void> {
    return this.http.post<void>('/api/directories', { path });
  }

  deleteDirectory(path: string): Observable<void> {
    const params = new HttpParams().set('path', path);
    return this.http.delete<void>('/api/directories', { params });
  }

  renameDirectory(path: string, newName: string): Observable<void> {
    return this.http.patch<void>('/api/directories/rename', {
      path,
      newName
    });
  }

  renameFile(path: string, newName: string): Observable<void> {
    return this.http.patch<void>('/api/files/rename', {
      path,
      newName
    });
  }

  moveFile(
    sourcePath: string,
    targetDirectory: string
  ): Observable<void> {

    return this.http.patch<void>('/api/files/move', {
      sourcePath,
      targetDirectory
    });
  }

  getDirectoryDownloadUrl(path: string): string {
    return `/api/directories/download?path=${encodeURIComponent(path)}`;
  }

  getAllDirectories(): Observable<DirectoryItem[]> {
    return this.http.get<DirectoryItem[]>('/api/directories/all');
  }

  getThumbnailUrl(path: string): string {
    return `/api/files/thumbnail?path=${encodeURIComponent(path)}`;
  }
}
