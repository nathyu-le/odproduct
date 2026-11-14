import { upload } from "../../api";
import { tx } from "../../i18n";
export async function importDocx(
  file: File,
): Promise<{ html: string; warnings: string[] }> {
  if (!/\.docx$/i.test(file.name) || file.size > 10 * 1024 * 1024)
    throw Error(tx("Chỉ nhận file DOCX tối đa 10 MB."));
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  let end = -1;
  for (
    let i = view.byteLength - 22;
    i >= Math.max(0, view.byteLength - 65557);
    i--
  )
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  if (end < 0) throw Error(tx("File DOCX không hợp lệ."));
  const entries = view.getUint16(end + 10, true),
    offset = view.getUint32(end + 16, true);
  let pos = offset,
    total = 0,
    documentFound = false;
  if (entries > 2000) throw Error(tx("File DOCX có quá nhiều thành phần."));
  for (let i = 0; i < entries; i++) {
    if (pos + 46 > view.byteLength || view.getUint32(pos, true) !== 0x02014b50)
      throw Error(tx("File DOCX bị hỏng."));
    const size = view.getUint32(pos + 24, true),
      nameLength = view.getUint16(pos + 28, true),
      extra = view.getUint16(pos + 30, true),
      comment = view.getUint16(pos + 32, true);
    const name = new TextDecoder().decode(
      new Uint8Array(buffer, pos + 46, nameLength),
    );
    if (view.getUint16(pos + 8, true) & 1)
      throw Error(tx("Không hỗ trợ DOCX có mật khẩu."));
    if (name === "word/document.xml") documentFound = true;
    total += size;
    if (total > 40 * 1024 * 1024 || size > 20 * 1024 * 1024)
      throw Error(tx("Nội dung giải nén quá lớn."));
    pos += 46 + nameLength + extra + comment;
  }
  if (!documentFound)
    throw Error(tx("File này không phải tài liệu Word DOCX."));
  const mammoth = await import("mammoth/mammoth.browser");
  let imageCount = 0;
  const result = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      styleMap: [
        "p[style-name='Title'] => h2:fresh",
        "p[style-name='Heading 1'] => h2:fresh",
        "p[style-name='Heading 2'] => h3:fresh",
      ],
      convertImage: mammoth.images.imgElement(async (image: any) => {
        if (++imageCount > 50) throw Error(tx("Mỗi lần nhập tối đa 50 ảnh."));
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(image.contentType)
        )
          throw Error(tx("Ảnh trong Word cần là JPG, PNG hoặc WebP."));
        const base64 = await image.read("base64");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        if (bytes.byteLength > 5 * 1024 * 1024)
          throw Error(tx("Mỗi ảnh trong Word tối đa 5 MB."));
        const ext =
          image.contentType === "image/jpeg"
            ? "jpg"
            : image.contentType.split("/")[1];
        const path = await upload(
          new File([bytes], `document-${imageCount}.${ext}`, {
            type: image.contentType,
          }),
        );
        return { src: path, alt: image.altText || "" };
      }),
    },
  );
  const { default: DOMPurify } = await import("dompurify");
  return {
    html: DOMPurify.sanitize(result.value, {
      ADD_ATTR: ["target"],
      FORBID_TAGS: ["style", "script", "iframe", "svg", "math"],
    }),
    warnings: result.messages.map((m: any) => m.message),
  };
}
