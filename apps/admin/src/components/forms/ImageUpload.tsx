"use client";

interface ImageUploadProps {
  label?: string;
  images: string[];
  onChange: (images: string[]) => void;
  multiple?: boolean;
  maxImages?: number;
  hint?: string;
}

export function ImageUpload({
  label,
  images,
  onChange,
  multiple = true,
  maxImages = 10,
  hint,
}: ImageUploadProps) {
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remaining = maxImages - images.length;
      const filesToProcess = Array.from(files).slice(0, remaining);

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange([...images, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const inputId = `image-upload-${label?.replace(/\s/g, "-").toLowerCase() || "default"}`;

  return (
    <div className="w-full">
      {label && (
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {label}
        </h3>
      )}

      {images.length < maxImages && (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-luxury-gold transition-colors">
          <input
            type="file"
            id={inputId}
            accept="image/*"
            multiple={multiple}
            onChange={handleUpload}
            className="hidden"
          />
          <label htmlFor={inputId} className="cursor-pointer">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-400 mb-1">Click to upload images</p>
            <p className="text-gray-500 text-sm">PNG, JPG, WEBP up to 10MB each</p>
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4 mt-4">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={img}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-contain bg-white rounded-xl"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
    </div>
  );
}
