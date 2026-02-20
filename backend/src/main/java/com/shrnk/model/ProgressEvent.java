package com.shrnk.model;

public class ProgressEvent {
    private String sessionId;
    private double percent;
    private long bytesProcessed;
    private long totalBytes;
    private String eta;
    private String status;
    private String currentFile;

    public ProgressEvent() {
    }

    public ProgressEvent(String sessionId, double percent, long bytesProcessed, long totalBytes, String eta,
            String status, String currentFile) {
        this.sessionId = sessionId;
        this.percent = percent;
        this.bytesProcessed = bytesProcessed;
        this.totalBytes = totalBytes;
        this.eta = eta;
        this.status = status;
        this.currentFile = currentFile;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public double getPercent() {
        return percent;
    }

    public void setPercent(double percent) {
        this.percent = percent;
    }

    public long getBytesProcessed() {
        return bytesProcessed;
    }

    public void setBytesProcessed(long bytesProcessed) {
        this.bytesProcessed = bytesProcessed;
    }

    public long getTotalBytes() {
        return totalBytes;
    }

    public void setTotalBytes(long totalBytes) {
        this.totalBytes = totalBytes;
    }

    public String getEta() {
        return eta;
    }

    public void setEta(String eta) {
        this.eta = eta;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCurrentFile() {
        return currentFile;
    }

    public void setCurrentFile(String currentFile) {
        this.currentFile = currentFile;
    }
}
