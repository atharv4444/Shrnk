package com.shrnk.model;

public class ProcessingConfig {
    private String resizeOption; // "50", "25", or "WxH" format
    private String password; // null = no encryption
    private boolean stripMetadata;

    public ProcessingConfig() {
    }

    public String getResizeOption() {
        return resizeOption;
    }

    public void setResizeOption(String resizeOption) {
        this.resizeOption = resizeOption;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isStripMetadata() {
        return stripMetadata;
    }

    public void setStripMetadata(boolean stripMetadata) {
        this.stripMetadata = stripMetadata;
    }
}
