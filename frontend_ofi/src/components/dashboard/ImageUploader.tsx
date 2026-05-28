import React, { useState, useRef, useCallback } from 'react';
import { CloudUpload, Trash2, Image, X, Sparkles, Camera, Upload, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useApi } from '../../hooks/useApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Card } from '../ui/Card';

export const ImageUploader: React.FC = () => {
  const { t } = useTranslation();
  const { uploadImagesAndGetSimulation } = useApi();
  const { connected: wsConnected } = useWebSocket();
  const [activeTab, setActiveTab] = useState<'manual' | 'camera'>('manual');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  // Process Files Helper
  const processFiles = useCallback((files: FileList) => {
    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      // Limit to max 4 images
      return combined.slice(0, 4);
    });
  }, []);

  // Handle Drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  // Handle File Input Change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
    },
    [processFiles]
  );

  // Trigger File Input Click
  const handleBoxClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Remove File from Selection
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Clear All
  const clearAll = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Submit and Upload
  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      await uploadImagesAndGetSimulation(selectedFiles);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto border-nuclear/20 bg-surface-elevated/70 shadow-[0_0_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
      {/* Invisible Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="space-y-6">
        {/* Title / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-nuclear-container/10 border border-nuclear/30 text-nuclear-bright animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold font-heading text-white tracking-wide uppercase">
            {t('start_title')}
          </h3>
          <p className="text-xs text-text-muted leading-relaxed font-mono">
            {t('uploader_subtitle')}
          </p>
        </div>

        {/* Tab System Selector */}
        <div className="flex border-b border-border-dim/40 p-0.5 bg-surface-void/50 rounded-lg max-w-md mx-auto overflow-hidden">
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-mono font-bold transition-all duration-200 cursor-pointer rounded-md ${
              activeTab === 'manual'
                ? 'bg-nuclear-container/30 border border-nuclear-dark text-nuclear-bright shadow-[0_0_5px_rgba(0,255,159,0.2)] animate-pulse'
                : 'text-text-muted hover:text-text-secondary border border-transparent'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-cyan-rad" />
            <span>{t('uploader_tab_manual')}</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-mono font-bold transition-all duration-200 cursor-pointer rounded-md ${
              activeTab === 'camera'
                ? 'bg-cyan-dark/35 border border-cyan-rad/55 text-cyan-rad shadow-[0_0_5px_rgba(0,210,253,0.2)] animate-pulse'
                : 'text-text-muted hover:text-text-secondary border border-transparent'
            }`}
          >
            <Camera className="h-3.5 w-3.5 text-nuclear-bright" />
            <span>{t('uploader_tab_camera')}</span>
          </button>
        </div>

        {activeTab === 'manual' ? (
          <>
            {/* Drop Zone Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleBoxClick}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center space-y-4 select-none ${
                isDragActive
                  ? 'border-nuclear bg-nuclear-container/10 scale-[1.01] shadow-[0_0_15px_rgba(0,255,159,0.15)]'
                  : 'border-border-dim hover:border-cyan-rad bg-surface-void/40 hover:bg-surface-void/60 shadow-inner'
              }`}
            >
              <CloudUpload
                className={`h-12 w-12 transition-transform duration-300 ${
                  isDragActive ? 'text-nuclear-bright scale-110' : 'text-cyan-rad'
                }`}
              />

              <div className="text-center space-y-1">
                <p className="text-xs font-mono font-bold text-text-primary">
                  {isDragActive ? t('uploader_drop_active') : t('uploader_title_drag')}
                </p>
                <p className="text-[10px] font-mono text-text-muted">
                  {t('uploader_limit')}
                </p>
              </div>
            </div>

            {/* Previews Section */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3 border-t border-border-dim/30 pt-5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-text-secondary font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5 text-cyan-rad" />
                    {t('uploader_previews')}
                  </span>
                  <span className="text-text-muted bg-surface-void border border-border-dim px-2 py-0.5 rounded text-[10px]">
                    {selectedFiles.length} / 4
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedFiles.map((file, idx) => {
                    const objectUrl = URL.createObjectURL(file);
                    return (
                      <div
                        key={`${file.name}-${idx}`}
                        className="group relative rounded bg-surface-void border border-border-dim overflow-hidden hover:border-nuclear-dark transition-all duration-200 aspect-square shadow-md"
                      >
                        <img
                          src={objectUrl}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onLoad={() => URL.revokeObjectURL(objectUrl)}
                        />
                        
                        {/* Dark overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(idx);
                            }}
                            className="self-end p-1 rounded-full bg-rose-dark/70 hover:bg-rose-default hover:text-white text-rose-light border border-rose-dark/80 cursor-pointer shadow transition-all duration-150 active:scale-90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          
                          <div className="text-[8px] font-mono text-text-primary bg-black/60 px-1 py-0.5 rounded truncate">
                            {file.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Buttons / Actions */}
            {selectedFiles.length > 0 && (
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={clearAll}
                  disabled={isUploading}
                  className="flex items-center space-x-1.5 px-4 py-2 border border-border-dim hover:border-rose-dark/60 bg-surface-void hover:bg-rose-dark/10 text-text-muted hover:text-rose-light rounded text-xs font-mono font-bold transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{t('uploader_btn_clear')}</span>
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={isUploading}
                  className="flex items-center space-x-2 px-5 py-2 bg-nuclear-container/20 hover:bg-nuclear-container/45 border border-nuclear-dark hover:border-nuclear-bright text-nuclear-bright rounded text-xs font-mono font-bold transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(0,255,159,0.1)] hover:shadow-[0_0_15px_rgba(0,255,159,0.25)] active:scale-95 disabled:opacity-50 disabled:animate-pulse"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isUploading ? t('sys_status_processing') : t('uploader_btn_analyze')}</span>
                </button>
              </div>
            )}
          </>
        ) : (
          /* Live 360 Camera Scanning animated card */
          <div className="p-8 border border-border-dim/40 rounded-xl bg-surface-void/40 flex flex-col items-center text-center space-y-6 animate-fade-in">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Pulsing glow ring */}
              <div className="absolute w-full h-full rounded-full bg-cyan-rad/15 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full bg-cyan-rad/5 border border-cyan-rad/20" />
              
              {/* Core circle */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-dark to-cyan-rad flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,210,253,0.35)]">
                <Camera className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-md font-heading font-bold text-white tracking-wide">
                {t('camera_waiting_title')}
              </h4>
              <p className="text-xs text-text-muted leading-relaxed font-mono max-w-md mx-auto">
                {t('camera_waiting_desc')}
              </p>
            </div>

            {/* Connection Telemetry Badge */}
            <div className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border text-xs font-mono font-bold transition-all duration-300 ${
              wsConnected
                ? 'bg-nuclear-container/20 border-nuclear-dark text-nuclear-bright shadow-[0_0_10px_rgba(0,255,159,0.15)]'
                : 'bg-surface-void border-border-dim text-text-muted animate-pulse'
            }`}>
              {wsConnected ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nuclear-bright opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-nuclear-bright"></span>
                  </span>
                  <span>{t('camera_status_connected')}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-text-muted" />
                  <span>{t('camera_status_disconnected')}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
