import { Component, OnInit } from '@angular/core';
import { FileItem } from '../../models/file-item.model';
import {OrionFileService} from '../../services/orion-file';
import { FormsModule } from '@angular/forms';
import {NgFor, NgIf} from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import {DirectoryItem} from '../../models/directory-item.model';

@Component({
  selector: 'app-files',
  standalone: true,
  templateUrl: './files.html',
  styleUrl: './files.css',
  imports: [NgFor, NgIf, FormsModule],
})
export class FilesComponent implements OnInit {

  directories: DirectoryItem[] = [];
  currentPath = '';
  files: FileItem[] = [];

  renameDirectoryPath = '';
  renameDirectoryName = '';

  renameFilePath = '';
  renameFileName = '';

  moveFilePath = '';
  moveTargetDirectory = '';
  printedFilter: boolean | null = null;
  allDirectories: DirectoryItem[] = [];

  page = 0;
  size = 20;
  totalPages = 0;
  newDirectoryName = '';
  previewFile: FileItem | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadMessage = '';
  errorMessage = '';
  successMessage = '';
  constructor(public fileService: OrionFileService) {}

  ngOnInit(): void {
    this.loadDirectories();
    this.loadAllDirectories();
  }

  loadAllDirectories(): void {
    this.fileService.getAllDirectories().subscribe({
      next: directories => {
        this.allDirectories = directories;
      },
      error: error => console.error(error)
    });
  }

  loadDirectories(): void {
    this.fileService.getDirectories(this.currentPath).subscribe({
      next: directories => {
        this.directories = directories;
      },
      error: error => console.error(error)
    });
  }
  createDirectory(): void {
    const name = this.newDirectoryName.trim();

    if (!name) {
      return;
    }

    const path = this.currentPath
      ? `${this.currentPath}/${name}`
      : name;

    this.fileService.createDirectory(path).subscribe({
      next: () => {
        this.newDirectoryName = '';
        this.loadDirectories();
      },
      error: error => console.error(error)
    });
  }

  openPreview(file: FileItem): void {
    this.previewFile = file;
  }

  closePreview(): void {
    this.previewFile = null;
  }
  loadFiles(): void {
    this.fileService.getFiles(
      this.currentPath,
      this.page,
      this.size,
      this.printedFilter
    ).subscribe({
      next: response => {
        this.files = response.content;
        this.totalPages = response.totalPages;
      },
      error: error => console.error(error)
    });
  }
  setPrintedFilter(value: boolean | null): void {
    this.printedFilter = value;
    this.page = 0;
    this.loadFiles();
  }
  togglePrinted(file: FileItem): void {
    this.fileService.updatePrinted(file.path, !file.printed).subscribe({
      next: () => {
        file.printed = !file.printed;
      },
      error: error => console.error(error)
    });
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadMessage = `Uploading 0 / ${files.length}`;

    let completed = 0;

    const uploadNext = (index: number) => {
      if (index >= files.length) {

        this.uploadProgress = 100;
        this.uploadMessage = 'Processing files...';

        this.loadDirectories();

        setTimeout(() => {

          this.loadFiles();
          this.files = [...this.files];
          this.isUploading = false;
          this.uploadMessage = '';
          this.successMessage = `Uploaded ${completed} file(s).`;

        }, 300);

        input.value = '';

        return;
      }

      const file = files[index];

      this.uploadMessage = `Uploading ${index + 1} / ${files.length}: ${file.name}`;

      this.fileService.upload(file, this.currentPath).subscribe({
        next: event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const fileProgress = Math.round((event.loaded / event.total) * 100);
            this.uploadProgress = Math.round(((index + fileProgress / 100) / files.length) * 100);
          }

          if (event.type === HttpEventType.Response) {
            completed++;
            uploadNext(index + 1);
          }
        },
        error: error => {
          console.error(error);

          this.isUploading = false;
          this.uploadMessage = '';
          this.errorMessage = `Upload failed for: ${file.name}`;
          input.value = '';
        }
      });
    };

    uploadNext(0);
  }

  deleteFile(file: FileItem): void {
    this.fileService.delete(file.path).subscribe({
      next: () => this.loadFiles(),
      error: error => console.error(error)
    });
  }

  nextPage(): void {
    if (this.page + 1 >= this.totalPages) {
      return;
    }

    this.page++;
    this.loadFiles();
  }

  previousPage(): void {
    if (this.page === 0) {
      return;
    }

    this.page--;
    this.loadFiles();
  }

  get breadcrumbs(): { name: string; path: string }[] {
    if (!this.currentPath) {
      return [];
    }

    const parts = this.currentPath.split('/');

    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join('/')
    }));
  }

  openDirectory(directory: DirectoryItem): void {
    this.currentPath = directory.path;
    this.page = 0;
    this.loadDirectories();
    this.loadFiles();
  }

  goToPath(path: string): void {
    this.currentPath = path;
    this.page = 0;
    this.loadDirectories();
    this.loadFiles();
  }

  goHome(): void {
    this.goToPath('');
  }

  deleteDirectory(directory: DirectoryItem): void {

    const confirmed = confirm(
      `Delete directory "${directory.name}" and all contents?`
    );

    if (!confirmed) {
      return;
    }

    this.fileService.deleteDirectory(directory.path).subscribe({
      next: () => {

        if (this.currentPath === directory.path) {
          this.goHome();
        } else {
          this.loadDirectories();
        }

      },
      error: error => console.error(error)
    });
  }

  startRenameDirectory(directory: DirectoryItem): void {
    this.renameDirectoryPath = directory.path;
    this.renameDirectoryName = directory.name;
  }

  cancelRenameDirectory(): void {
    this.renameDirectoryPath = '';
    this.renameDirectoryName = '';
  }

  confirmRenameDirectory(directory: DirectoryItem): void {

    const newName = this.renameDirectoryName.trim();

    if (!newName) {
      return;
    }

    this.fileService.renameDirectory(directory.path, newName).subscribe({
      next: () => {

        this.cancelRenameDirectory();

        if (this.currentPath.startsWith(directory.path)) {

          const parentPath = directory.path
            .split('/')
            .slice(0, -1)
            .join('/');

          this.currentPath = parentPath
            ? `${parentPath}/${newName}`
            : newName;
        }

        this.loadDirectories();
        this.loadFiles();

      },
      error: error => console.error(error)
    });
  }

  startRenameFile(file: FileItem): void {
    this.renameFilePath = file.path;
    this.renameFileName = file.name;
  }

  cancelRenameFile(): void {
    this.renameFilePath = '';
    this.renameFileName = '';
  }

  confirmRenameFile(file: FileItem): void {
    const newName = this.renameFileName.trim();

    if (!newName) {
      return;
    }

    this.fileService.renameFile(file.path, newName).subscribe({
      next: () => {
        this.cancelRenameFile();
        this.loadFiles();
      },
      error: error => console.error(error)
    });
  }

  startMoveFile(file: FileItem): void {
    this.moveFilePath = file.path;
    this.moveTargetDirectory = this.currentPath;
  }

  cancelMoveFile(): void {
    this.moveFilePath = '';
    this.moveTargetDirectory = '';
  }

  confirmMoveFile(file: FileItem): void {

    const target = this.moveTargetDirectory.trim();

    if (!target) {
      return;
    }

    this.fileService.moveFile(file.path, target).subscribe({
      next: () => {

        this.cancelMoveFile();
        this.loadFiles();
        this.loadDirectories();

      },
      error: error => console.error(error)
    });
  }
}
