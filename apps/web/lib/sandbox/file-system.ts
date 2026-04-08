export interface FileData {
  path: string;
  content: string;
  type: "file";
  name: string; // Added name property for proper display
}

export interface DirectoryData {
  path: string;
  type: "directory";
  name: string; // Added name property for proper display
  children: Record<string, FileNode>;
}

export type FileNode = FileData | DirectoryData;

export class FileSystem {
  private files: Record<string, string>;

  constructor(initialFiles: Record<string, string> = {}) {
    this.files = { ...initialFiles };
  }

  getFile(path: string): FileData | null {
    const content = this.files[path];
    if (content === undefined) return null;

    return {
      path,
      content,
      type: "file",
      name: path.split("/").pop() || path, // Extract filename from path
    };
  }

  getAllFiles(): FileData[] {
    return Object.entries(this.files).map(([path, content]) => ({
      path,
      content,
      type: "file" as const,
      name: path.split("/").pop() || path, // Extract filename from path
    }));
  }

  updateFile(path: string, content: string): void {
    this.files[path] = content;
  }

  createFile(path: string, content = ""): void {
    this.files[path] = content;
  }

  deleteFile(path: string): void {
    delete this.files[path];
  }

  renameFile(oldPath: string, newPath: string): void {
    if (this.files[oldPath] !== undefined) {
      this.files[newPath] = this.files[oldPath];
      delete this.files[oldPath];
    }
  }

  getFileTree(): Record<string, FileNode> {
    const tree: Record<string, FileNode> = {};

    Object.keys(this.files).forEach((path) => {
      const parts = path.split("/");
      let current = tree;

      parts.forEach((part, index) => {
        const currentPath = parts.slice(0, index + 1).join("/");

        if (index === parts.length - 1) {
          // This is a file
          current[part] = {
            path: currentPath,
            content: this.files[path],
            type: "file",
            name: part, // Use the part as name
          };
        } else {
          // This is a directory
          if (!current[part] || current[part].type !== "directory") {
            current[part] = {
              path: currentPath,
              type: "directory",
              name: part, // Use the part as name
              children: {},
            };
          }
          current = (current[part] as DirectoryData).children;
        }
      });
    });

    return tree;
  }

  clone(): FileSystem {
    return new FileSystem(this.files);
  }

  getFilesObject(): Record<string, string> {
    return { ...this.files };
  }
}
