import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const App = () => {
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('الرجاء اختيار ملف صورة صالح.');
                return;
            }
            
            setError('');
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.onerror = () => {
                setError('حدث خطأ أثناء قراءة الصورة.');
            }
            reader.readAsDataURL(file);
        }
    }, []);

    const handleAnalyze = async () => {
        if (!image || !imageFile) {
            setError('الرجاء تحميل صورة أولاً.');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const base64Data = image.split(',')[1];

            const imagePart = {
                inlineData: {
                    mimeType: imageFile.type,
                    data: base64Data,
                },
            };

            const textPart = {
                text: "حلل صورة 'بوصلة أداء مربية ذوي الاحتياجات الخاصة' المرفقة. قم بوصف المجالات الرئيسية، وتقييم الأداء المشار إليه في كل مجال، وقدم تحليلاً شاملاً مع توصيات عملية وقابلة للتنفيذ لتحسين الأداء.",
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            
            setAnalysis(response.text);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع.';
            setError(`فشل التحليل: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>محلل بوصلة الأداء للمربيات</h1>
            <p>قم بتحميل صورة بوصلة أداء مربية في مجال ذوي الاحتياجات الخاصة، وسيقوم الذكاء الاصطناعي بتحليلها وتقديم رؤى قيمة.</p>

            <label htmlFor="file-upload" className="upload-area" aria-label="تحميل صورة البوصلة">
                <span className="upload-label">
                    {image ? `تم اختيار الصورة: ${imageFile?.name}` : "انقر هنا لاختيار صورة البوصلة"}
                </span>
            </label>
            <input 
                id="file-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                aria-hidden="true"
            />
            
            {image && <img id="image-preview" src={image} alt="معاينة البوصلة" />}

            <div style={{ marginTop: '20px' }}>
                <button onClick={handleAnalyze} disabled={!image || loading} aria-label="بدء تحليل الصورة">
                    {loading ? 'جاري التحليل...' : 'تحليل'}
                </button>
            </div>

            {loading && <div className="loader" aria-label="جاري التحليل"></div>}

            {error && <div className="error" role="alert">{error}</div>}

            {analysis && (
                <div className="result-area" aria-live="polite">
                    <h2>نتائج التحليل</h2>
                    <div className="result-content">{analysis}</div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);