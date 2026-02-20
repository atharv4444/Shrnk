package com.shrnk.service;

import net.coobird.thumbnailator.Thumbnails;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ImageService {

    private static final int BUFFER_SIZE = 8192; // 8KB

    /**
     * Resize an image by percentage (e.g. 50 = 50%)
     */
    public File resizeByPercent(File inputFile, int percent, Path outputDir) throws IOException {
        String outputName = addSuffix(inputFile.getName(), "_" + percent + "pct");
        File outputFile = outputDir.resolve(outputName).toFile();

        double scale = percent / 100.0;
        Thumbnails.of(inputFile)
                .scale(scale)
                .outputQuality(0.9)
                .toFile(outputFile);

        return outputFile;
    }

    /**
     * Resize an image to specific dimensions
     */
    public File resizeToExact(File inputFile, int width, int height, Path outputDir) throws IOException {
        String outputName = addSuffix(inputFile.getName(), "_" + width + "x" + height);
        File outputFile = outputDir.resolve(outputName).toFile();

        Thumbnails.of(inputFile)
                .size(width, height)
                .keepAspectRatio(true)
                .outputQuality(0.9)
                .toFile(outputFile);

        return outputFile;
    }

    /**
     * Resize an image during the stream (for in-stream zip processing)
     */
    public byte[] resizeInStream(InputStream inputStream, String fileName, String resizeOption) throws IOException {
        BufferedImage original = ImageIO.read(inputStream);
        if (original == null)
            return null; // not an image

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        if (resizeOption.contains("x")) {
            String[] parts = resizeOption.split("x");
            int w = Integer.parseInt(parts[0]);
            int h = Integer.parseInt(parts[1]);
            Thumbnails.of(original).size(w, h).keepAspectRatio(true).outputFormat(getExtension(fileName))
                    .toOutputStream(baos);
        } else {
            double scale = Integer.parseInt(resizeOption) / 100.0;
            Thumbnails.of(original).scale(scale).outputFormat(getExtension(fileName)).toOutputStream(baos);
        }

        return baos.toByteArray();
    }

    /**
     * Process batch of files in parallel using parallel streams
     */
    public List<File> processBatch(List<File> inputFiles, String resizeOption, Path outputDir, boolean stripMeta) {
        return inputFiles.parallelStream()
                .map(file -> {
                    try {
                        File processed;
                        if (isImage(file.getName())) {
                            if (resizeOption != null && !resizeOption.isEmpty()) {
                                if (resizeOption.contains("x")) {
                                    String[] parts = resizeOption.split("x");
                                    processed = resizeToExact(file, Integer.parseInt(parts[0]),
                                            Integer.parseInt(parts[1]), outputDir);
                                } else {
                                    processed = resizeByPercent(file, Integer.parseInt(resizeOption), outputDir);
                                }
                            } else {
                                // Copy without resize
                                processed = outputDir.resolve(file.getName()).toFile();
                                Files.copy(file.toPath(), processed.toPath(), StandardCopyOption.REPLACE_EXISTING);
                            }

                            if (stripMeta) {
                                stripExifData(processed);
                            }

                            return processed;
                        } else {
                            // Non-image files — just copy
                            processed = outputDir.resolve(file.getName()).toFile();
                            Files.copy(file.toPath(), processed.toPath(), StandardCopyOption.REPLACE_EXISTING);
                            return processed;
                        }
                    } catch (IOException e) {
                        throw new UncheckedIOException(e);
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * Strip EXIF metadata from an image by re-encoding it
     */
    public void stripExifData(File imageFile) throws IOException {
        if (!isImage(imageFile.getName()))
            return;

        BufferedImage image = ImageIO.read(imageFile);
        if (image == null)
            return;

        String ext = getExtension(imageFile.getName());
        // Re-write the image without metadata
        BufferedImage clean = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        clean.getGraphics().drawImage(image, 0, 0, null);
        ImageIO.write(clean, ext, imageFile);
    }

    public boolean isImage(String fileName) {
        String lower = fileName.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")
                || lower.endsWith(".gif") || lower.endsWith(".bmp") || lower.endsWith(".webp");
    }

    private String getExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0)
            return "jpg";
        String ext = fileName.substring(dot + 1).toLowerCase();
        if (ext.equals("jpeg"))
            return "jpg";
        return ext;
    }

    private String addSuffix(String fileName, String suffix) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0)
            return fileName + suffix;
        return fileName.substring(0, dot) + suffix + fileName.substring(dot);
    }
}
