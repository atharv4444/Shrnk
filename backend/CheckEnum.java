import net.lingala.zip4j.model.enums.CompressionLevel;
public class CheckEnum {
    public static void main(String[] args) {
        for (CompressionLevel level : CompressionLevel.values()) {
            System.out.println(level.name());
        }
    }
}
