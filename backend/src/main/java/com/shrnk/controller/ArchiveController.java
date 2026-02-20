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
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "resizeOption", required = false) String resizeOption,
            @RequestParam(value = "stripMetadata", defaultValue = "false") boolean stripMetadata) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            File zipFile = archiveService.createZip(sessionId, files, password, resizeOption, stripMetadata);
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
    public ResponseEntity<List<FileEntry>> peekZip(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password) {

        try {
            List<FileEntry> entries = archiveService.peekZip(file, password);
            return ResponseEntity.ok(entries);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
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
            File resultZip = archiveService.extractSelected(sessionId, file, paths, password);
            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("fileName", resultZip.getName());
            response.put("size", resultZip.length());
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
    public ResponseEntity<Resource> download(@PathVariable String sessionId) {
        try {
            Path outputDir = archiveService.getSessionOutputDir(sessionId);
            if (!Files.exists(outputDir)) {
                return ResponseEntity.notFound().build();
            }

            // Find first file in output dir
            Optional<Path> outputFile;
            try (var stream = Files.list(outputDir)) {
                outputFile = stream.filter(Files::isRegularFile).findFirst();
            }

            if (outputFile.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            File file = outputFile.get().toFile();
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
     * SSE endpoint for real-time progress tracking
     */
    @GetMapping("/progress/{sessionId}")
    public SseEmitter progress(@PathVariable String sessionId) {
        return progressService.createEmitter(sessionId);
    }
}
