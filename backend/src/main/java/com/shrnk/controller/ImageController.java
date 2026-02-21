package com.shrnk.controller;

import com.shrnk.service.ImageService;
import com.shrnk.service.ProgressService;
import net.lingala.zip4j.ZipFile;
import net.lingala.zip4j.model.ZipParameters;
import net.lingala.zip4j.model.enums.CompressionMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/image")
public class ImageController {

    @Value("${shrnk.temp-dir}")
    private String tempDir;

    @Autowired
    private ImageService imageService;

    @Autowired
    private ProgressService progressService;

    /**
     * Upload images and resize them
     */
    @PostMapping("/resize")
    public ResponseEntity<Map<String, Object>> resizeImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("resizeOption") String resizeOption,
            @RequestParam(value = "stripMetadata", defaultValue = "false") boolean stripMetadata) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            Path sessionDir = Paths.get(tempDir, sessionId);
            Path inputDir = sessionDir.resolve("input");
            Path outputDir = sessionDir.resolve("output");
            Files.createDirectories(inputDir);
            Files.createDirectories(outputDir);

            // Save uploaded files
            List<File> savedFiles = new ArrayList<>();
            long totalBytes = 0;
            for (MultipartFile mf : files) {
                File saved = inputDir.resolve(mf.getOriginalFilename()).toFile();
                try (InputStream is = mf.getInputStream();
                        OutputStream os = new BufferedOutputStream(new FileOutputStream(saved), 8192)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = is.read(buffer)) != -1) {
                        os.write(buffer, 0, read);
                    }
                }
                totalBytes += saved.length();
                savedFiles.add(saved);
            }

            // Process images directly to outputDir
            List<File> processed = imageService.processBatch(savedFiles, resizeOption, outputDir, stripMetadata);

            progressService.sendComplete(sessionId);

            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("totalFiles", processed.size());

            List<Map<String, Object>> fileDetails = new ArrayList<>();
            for (File f : processed) {
                Map<String, Object> detail = new HashMap<>();
                detail.put("name", f.getName());
                detail.put("size", f.length());
                detail.put("path", f.getName());
                fileDetails.add(detail);
            }
            response.put("files", fileDetails);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Strip metadata from uploaded images
     */
    @PostMapping("/strip-metadata")
    public ResponseEntity<Map<String, Object>> stripMetadata(
            @RequestParam("files") MultipartFile[] files) {

        String sessionId = UUID.randomUUID().toString();
        Map<String, Object> response = new HashMap<>();

        try {
            Path sessionDir = Paths.get(tempDir, sessionId);
            Path inputDir = sessionDir.resolve("input");
            Path outputDir = sessionDir.resolve("output");
            Files.createDirectories(inputDir);
            Files.createDirectories(outputDir);

            List<File> savedFiles = new ArrayList<>();
            for (MultipartFile mf : files) {
                File saved = inputDir.resolve(mf.getOriginalFilename()).toFile();
                try (InputStream is = mf.getInputStream();
                        OutputStream os = new BufferedOutputStream(new FileOutputStream(saved), 8192)) {
                    byte[] buffer = new byte[8192];
                    int read;
                    while ((read = is.read(buffer)) != -1) {
                        os.write(buffer, 0, read);
                    }
                }
                savedFiles.add(saved);
            }

            List<File> processed = imageService.processBatch(savedFiles, null, outputDir, true);

            progressService.sendComplete(sessionId);

            response.put("sessionId", sessionId);
            response.put("status", "complete");
            response.put("totalFiles", processed.size());

            List<Map<String, Object>> fileDetails = new ArrayList<>();
            for (File f : processed) {
                Map<String, Object> detail = new HashMap<>();
                detail.put("name", f.getName());
                detail.put("size", f.length());
                detail.put("path", f.getName());
                fileDetails.add(detail);
            }
            response.put("files", fileDetails);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Download processed images
     */
    @GetMapping("/download/{sessionId}")
    public ResponseEntity<Resource> download(
            @PathVariable String sessionId,
            @RequestParam(value = "path", required = false) String pathParam) {
        try {
            Path outputDir = Paths.get(tempDir, sessionId, "output");
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
     * SSE endpoint for progress
     */
    @GetMapping("/progress/{sessionId}")
    public SseEmitter progress(@PathVariable String sessionId) {
        return progressService.createEmitter(sessionId);
    }
}
