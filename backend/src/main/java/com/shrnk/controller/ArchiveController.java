package com.shrnk.controller;

import com.shrnk.model.FileEntry;
import com.shrnk.service.ArchiveService;
import com.shrnk.service.ProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@RestController
@RequestMapping("/api/archive")
public class ArchiveController {

    @Autowired
    private ArchiveService archiveService;

    @Autowired
    private ProgressService progressService;

    /**
     * Upload files and create a ZIP archive
     */
    @PostMapping("/zip")
    public ResponseEntity<Map<String, Object>> createZip(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "paths", required = false) List<String> paths,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "resizeOption", required = false) String resizeOption,
            @RequestParam(value = "stripMetadata", defaultValue = "false") boolean stripMetadata,
            @RequestParam(value = "compressionLevel", defaultValue = "NORMAL") String compressionLevel) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            File zipFile = archiveService.createZip(sessionId, files, paths, password, resizeOption, stripMetadata,
                    compressionLevel);
            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("fileName", zipFile.getName());
            response.put("size", zipFile.length());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Upload a ZIP and extract all files
     */
    @PostMapping("/unzip")
    public ResponseEntity<Map<String, Object>> extractZip(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            List<File> extracted = archiveService.extractZip(sessionId, file, password);
            List<Map<String, Object>> fileList = new ArrayList<>();
            for (File f : extracted) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("name", f.getName());
                entry.put("size", f.length());
                fileList.add(entry);
            }
            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("files", fileList);
            response.put("totalFiles", extracted.size());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Peek inside a ZIP — view file tree without extracting
     */
    @PostMapping("/peek")
    public ResponseEntity<Map<String, Object>> peekZip(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            List<FileEntry> entries = archiveService.peekZip(sessionId, file, password);
            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("entries", entries);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Extract selected files from a ZIP
     */
    @PostMapping("/extract-selected")
    public ResponseEntity<Map<String, Object>> extractSelected(
            @RequestParam("file") MultipartFile file,
            @RequestParam("paths") List<String> paths,
            @RequestParam(value = "password", required = false) String password) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            List<File> extracted = archiveService.extractSelected(sessionId, file, paths, password);
            List<Map<String, Object>> fileList = new ArrayList<>();
            for (File f : extracted) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("name", f.getName());
                entry.put("size", f.length());
                entry.put("path", f.getName()); // simple path for download
                fileList.add(entry);
            }
            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("files", fileList);
            response.put("totalFiles", extracted.size());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Download processed result by session ID
     */
    @GetMapping("/download/{sessionId}")
    public ResponseEntity<Resource> download(
            @PathVariable String sessionId,
            @RequestParam(value = "path", required = false) String pathParam) {
        try {
            Path outputDir = archiveService.getSessionOutputDir(sessionId);
            if (!Files.exists(outputDir)) {
                return ResponseEntity.notFound().build();
            }

            File file;
            if (pathParam != null && !pathParam.isEmpty()) {
                file = outputDir.resolve(pathParam).toFile();
                if (!file.exists() || !file.toPath().normalize().startsWith(outputDir.normalize())) {
                    return ResponseEntity.notFound().build();
                }
            } else {
                // Find first file in output dir
                Optional<Path> outputFile;
                try (var stream = Files.list(outputDir)) {
                    outputFile = stream.filter(Files::isRegularFile).findFirst();
                }

                if (outputFile.isEmpty()) {
                    return ResponseEntity.notFound().build();
                }
                file = outputFile.get().toFile();
            }

            FileSystemResource resource = new FileSystemResource(file);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(file.length())
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Preview endpoint for Peek Inside
     */
    @GetMapping("/preview/{sessionId}")
    public ResponseEntity<Resource> preview(
            @PathVariable String sessionId,
            @RequestParam("path") String zipPath) {
        try {
            Path sessionDir = archiveService.getSessionOutputDir(sessionId).getParent();
            File zipFile = sessionDir.resolve("peek_archive.zip").toFile();
            if (!zipFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            // Extract the single file to output dir for previewing
            Path outputDir = sessionDir.resolve("output");
            Files.createDirectories(outputDir);

            net.lingala.zip4j.ZipFile zip = new net.lingala.zip4j.ZipFile(zipFile);
            zip.extractFile(zipPath, outputDir.toString());

            File extractedFile = outputDir.resolve(zipPath).toFile();
            if (!extractedFile.exists()) {
                return ResponseEntity.notFound().build();
            }

            FileSystemResource resource = new FileSystemResource(extractedFile);

            String mimeType = Files.probeContentType(extractedFile.toPath());
            if (mimeType == null)
                mimeType = MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .contentLength(extractedFile.length())
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + extractedFile.getName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * SSE endpoint for real-time progress tracking
     */
    @GetMapping("/progress/{sessionId}")
    public SseEmitter progress(@PathVariable String sessionId) {
        return progressService.createEmitter(sessionId);
    }
}
