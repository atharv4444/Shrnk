package com.shrnk.service;

import com.shrnk.model.FileEntry;
import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.FileHeader;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.AesKeyStrength;
import net.lingala.zip4j.model.enums.CompressionLevel;
import net.lingala.zip4j.model.enums.CompressionMethod;
import net.lingala.zip4j.model.enums.EncryptionMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ArchiveService {

    private static final int BUFFER_SIZE = 8192; // 8KB buffered I/O

    @Value("${shrnk.temp-dir}")
    private String tempDir;

    @Autowired
    private ImageService imageService;

    @Autowired
    private ProgressService progressService;

    /**
     * Create session directory
     */
    public Path createSessionDir(String sessionId) throws IOException {
        Path dir = Paths.get(tempDir, sessionId);
        Files.createDirectories(dir);
        return dir;
    }

    /**
     * Create a ZIP archive from uploaded files
     */
    public File createZip(String sessionId, MultipartFile[] files, List<String> paths, String password,
            String resizeOption, boolean stripMetadata, String compressionLevelStr) throws IOException {
        Path sessionDir = createSessionDir(sessionId);
        Path inputDir = sessionDir.resolve("input");
        Path outputDir = sessionDir.resolve("output");
        Files.createDirectories(inputDir);
        Files.createDirectories(outputDir);

        // Save uploaded files to input dir
        long totalBytes = 0;
        List<File> savedFiles = new ArrayList<>();
        for (MultipartFile mf : files) {
            File saved = inputDir.resolve(mf.getOriginalFilename()).toFile();
            try (InputStream is = mf.getInputStream();
                    OutputStream os = new BufferedOutputStream(new FileOutputStream(saved), BUFFER_SIZE)) {
                byte[] buffer = new byte[BUFFER_SIZE];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    os.write(buffer, 0, read);
                }
            }
            totalBytes += saved.length();
            savedFiles.add(saved);
        }

        // Process images if resize option provided
        List<File> filesToZip;
        if (resizeOption != null && !resizeOption.isEmpty()) {
            Path processedDir = sessionDir.resolve("processed");
            Files.createDirectories(processedDir);
            filesToZip = imageService.processBatch(savedFiles, resizeOption, processedDir, stripMetadata);
        } else if (stripMetadata) {
            Path processedDir = sessionDir.resolve("processed");
            Files.createDirectories(processedDir);
            filesToZip = imageService.processBatch(savedFiles, null, processedDir, true);
        } else {
            filesToZip = savedFiles;
        }

        // Create ZIP
        File zipFile = outputDir.resolve("archive.zip").toFile();
        ZipFile zip = password != null && !password.isEmpty()
                ? new ZipFile(zipFile, password.toCharArray())
                : new ZipFile(zipFile);

        ZipParameters params = new ZipParameters();
        params.setCompressionMethod(CompressionMethod.DEFLATE);

        CompressionLevel level = CompressionLevel.NORMAL;
        if ("MAXIMUM".equalsIgnoreCase(compressionLevelStr))
            level = CompressionLevel.MAXIMUM;
        else if ("ULTRA".equalsIgnoreCase(compressionLevelStr))
            level = CompressionLevel.ULTRA;
        else if ("FAST".equalsIgnoreCase(compressionLevelStr))
            level = CompressionLevel.FAST;
        else if ("FASTER".equalsIgnoreCase(compressionLevelStr))
            level = CompressionLevel.FASTER;
        else if ("STORE".equalsIgnoreCase(compressionLevelStr)) {
            params.setCompressionMethod(CompressionMethod.STORE);
            level = CompressionLevel.NO_COMPRESSION;
        }
        params.setCompressionLevel(level);

        if (password != null && !password.isEmpty()) {
            params.setEncryptFiles(true);
            params.setEncryptionMethod(EncryptionMethod.AES);
            params.setAesKeyStrength(AesKeyStrength.KEY_STRENGTH_256);
        }

        long processedBytes = 0;
        for (int i = 0; i < filesToZip.size(); i++) {
            File f = filesToZip.get(i);

            // Reconstruct folder paths inside the zip if provided
            if (paths != null && i < paths.size() && paths.get(i) != null && !paths.get(i).isEmpty()) {
                params.setFileNameInZip(paths.get(i));
            } else {
                params.setFileNameInZip(f.getName());
            }

            zip.addFile(f, params);
            processedBytes += f.length();
            progressService.sendProgress(sessionId, processedBytes, totalBytes,
                    "Compressing", f.getName());
        }

        progressService.sendComplete(sessionId);
        return zipFile;
    }

    /**
     * Extract a ZIP archive
     */
    public List<File> extractZip(String sessionId, MultipartFile zipMultipart, String password) throws IOException {
        Path sessionDir = createSessionDir(sessionId);
        Path inputDir = sessionDir.resolve("input");
        Path outputDir = sessionDir.resolve("output");
        Files.createDirectories(inputDir);
        Files.createDirectories(outputDir);

        // Save uploaded zip
        File zipInput = inputDir.resolve(zipMultipart.getOriginalFilename()).toFile();
        try (InputStream is = zipMultipart.getInputStream();
                OutputStream os = new BufferedOutputStream(new FileOutputStream(zipInput), BUFFER_SIZE)) {
            byte[] buffer = new byte[BUFFER_SIZE];
            int read;
            while ((read = is.read(buffer)) != -1) {
                os.write(buffer, 0, read);
            }
        }

        ZipFile zip = password != null && !password.isEmpty()
                ? new ZipFile(zipInput, password.toCharArray())
                : new ZipFile(zipInput);

        zip.extractAll(outputDir.toString());
        progressService.sendComplete(sessionId);

        // Return list of extracted files
        List<File> extracted = new ArrayList<>();
        try (var stream = Files.walk(outputDir)) {
            stream.filter(Files::isRegularFile).forEach(p -> extracted.add(p.toFile()));
        }
        return extracted;
    }

    /**
     * Peek inside a ZIP — return file tree without extracting
     */
    public List<FileEntry> peekZip(String sessionId, MultipartFile zipMultipart, String password) throws IOException {
        Path sessionDir = createSessionDir(sessionId);
        Path tempFile = sessionDir.resolve("peek_archive.zip");
        Files.createDirectories(sessionDir);

        try (InputStream is = zipMultipart.getInputStream();
                OutputStream os = new BufferedOutputStream(new FileOutputStream(tempFile.toFile()), BUFFER_SIZE)) {
            byte[] buffer = new byte[BUFFER_SIZE];
            int read;
            while ((read = is.read(buffer)) != -1) {
                os.write(buffer, 0, read);
            }
        }

        ZipFile zip = password != null && !password.isEmpty()
                ? new ZipFile(tempFile.toFile(), password.toCharArray())
                : new ZipFile(tempFile.toFile());

        List<FileEntry> entries = new ArrayList<>();
        for (FileHeader header : zip.getFileHeaders()) {
            entries.add(new FileEntry(
                    header.getFileName(),
                    header.getFileName(),
                    header.getUncompressedSize(),
                    header.isDirectory()));
        }

        try {
            zip.close();
        } catch (Exception ignored) {
        }
        return entries;
    }

    /**
     * Extract selected files from a ZIP by their paths
     */
    public List<File> extractSelected(String sessionId, MultipartFile zipMultipart,
            List<String> selectedPaths, String password) throws IOException {
        Path sessionDir = createSessionDir(sessionId);
        Path inputDir = sessionDir.resolve("input");
        Path outputDir = sessionDir.resolve("output");
        Files.createDirectories(inputDir);
        Files.createDirectories(outputDir);

        // Save uploaded zip
        File zipInput = inputDir.resolve(zipMultipart.getOriginalFilename()).toFile();
        try (InputStream is = zipMultipart.getInputStream();
                OutputStream os = new BufferedOutputStream(new FileOutputStream(zipInput), BUFFER_SIZE)) {
            byte[] buffer = new byte[BUFFER_SIZE];
            int read;
            while ((read = is.read(buffer)) != -1) {
                os.write(buffer, 0, read);
            }
        }

        ZipFile zip = password != null && !password.isEmpty()
                ? new ZipFile(zipInput, password.toCharArray())
                : new ZipFile(zipInput);

        for (String path : selectedPaths) {
            zip.extractFile(path, outputDir.toString());
        }

        try {
            zip.close();
        } catch (Exception ignored) {
        }

        List<File> extracted = new ArrayList<>();
        try (var stream = Files.walk(outputDir)) {
            stream.filter(Files::isRegularFile).forEach(p -> extracted.add(p.toFile()));
        }

        progressService.sendComplete(sessionId);
        return extracted;
    }

    /**
     * Get the output directory for a session
     */
    public Path getSessionOutputDir(String sessionId) {
        return Paths.get(tempDir, sessionId, "output");
    }
}
