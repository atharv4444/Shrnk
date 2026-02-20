package com.shrnk.util;

import java.io.*;

public class StreamUtils {

    private static final int BUFFER_SIZE = 8192; // 8KB

    /**
     * Copy from input to output using 8KB buffered streaming
     */
    public static long copy(InputStream in, OutputStream out) throws IOException {
        byte[] buffer = new byte[BUFFER_SIZE];
        long total = 0;
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
            total += read;
        }
        return total;
    }

    /**
     * Save a stream to a file with buffered I/O
     */
    public static File saveToFile(InputStream in, File target) throws IOException {
        try (OutputStream out = new BufferedOutputStream(new FileOutputStream(target), BUFFER_SIZE)) {
            copy(in, out);
        }
        return target;
    }

    /**
     * Format bytes to human-readable string
     */
    public static String formatBytes(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        if (bytes < 1024 * 1024)
            return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024)
            return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
