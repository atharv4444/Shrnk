package com.shrnk.model;

public class FileEntry {
    private String name;
    private String path;
    private long size;
    private boolean directory;

    public FileEntry() {
    }

    public FileEntry(String name, String path, long size, boolean directory) {
        this.name = name;
        this.path = path;
        this.size = size;
        this.directory = directory;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public boolean isDirectory() {
        return directory;
    }

    public void setDirectory(boolean directory) {
        this.directory = directory;
    }
}
