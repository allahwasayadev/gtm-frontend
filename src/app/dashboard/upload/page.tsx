'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { Button, PageHeader, PageTransition, Input, buttonClasses } from '@/components/ui';
import { CloudUpload, Check, Info, FileSpreadsheet, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/error-utils';

export default function UploadPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!validTypes.includes(selectedFile.type) && !isValidExtension) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    if (!listName) {
      const nameWithoutExt = selectedFile.name.replace(/\.(csv|xlsx|xls)$/i, '');
      setListName(nameWithoutExt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !listName.trim()) {
      toast.error('Please provide both a file and a name');
      return;
    }

    setUploading(true);
    try {
      const response = await accountListsApi.upload(file, listName.trim());
      toast.success('Account list uploaded successfully!');
      router.push(`/dashboard/lists/${response.data.id}`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to upload file'));
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return null;
  }

  const isReady = !!file && !!listName.trim();

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
      <PageHeader
        title="Upload Account List"
        description="Import your accounts from CSV or Excel"
        backHref="/dashboard"
      />
        <PageTransition>
          <form onSubmit={handleSubmit}>
            <div className="bg-surface rounded-lg border border-hairline shadow-card overflow-hidden">
              {/* Quiet section header on the card's own surface, matching the
                  rest of the app; the accent is carried by the icon. */}
              <div className="flex items-center gap-3 border-b border-hairline bg-sunken px-5 py-3.5 sm:px-8">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-accent-soft">
                  <CloudUpload className="h-[18px] w-[18px] text-accent-ink" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-ink sm:text-[17px]">Import Accounts</h2>
                  <p className="text-xs text-ink-3 sm:text-[12.5px]">
                    Upload a spreadsheet with your account names
                  </p>
                </div>
              </div>

              {/* Steps Body */}
              <div className="px-5 sm:px-8 py-6">
                {/* Step 1: Name */}
                <div className="flex gap-4 sm:gap-5">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-md transition-all duration-300 ${
                      listName.trim()
                        ? 'bg-ok text-white'
                        : 'bg-accent text-white'
                    }`}>
                      {listName.trim() ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <div className={`w-px flex-1 mt-3 transition-colors duration-300 ${listName.trim() ? 'bg-ok-soft' : 'bg-surface-2'}`} />
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 id="upload-name-step" className="font-semibold text-ink mb-0.5">Name your list</h3>
                    <p id="upload-name-hint" className="text-sm text-ink-3 mb-4">Choose a descriptive name for easy identification</p>
                    {/* The shared field, so this one gets the same 44px height,
                        16px type and focus treatment as every other input. The
                        step heading is the field's name: a placeholder is not
                        one, and it disappears as soon as anything is typed. */}
                    <Input
                      type="text"
                      required
                      aria-labelledby="upload-name-step"
                      aria-describedby="upload-name-hint"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="e.g., Q1 2025 Target Accounts"
                    />
                  </div>
                </div>

                {/* Step 2: File */}
                <div className="flex gap-4 sm:gap-5">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-md transition-all duration-300 ${
                      file
                        ? 'bg-ok text-white'
                        : 'bg-accent text-white'
                    }`}>
                      {file ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-ink mb-0.5">Choose your file</h3>
                    <p className="text-sm text-ink-3 mb-4">Drag and drop or browse for a spreadsheet</p>

                    {/* Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-md text-center transition-all duration-200 ${
                        dragActive
                          ? 'border-accent bg-accent-soft/80 shadow-e2 p-6 sm:p-10'
                          : file
                            ? 'border-ok bg-ok-soft/30 p-4'
                            : 'border-hairline hover:border-accent hover:bg-sunken/50 p-6 sm:p-10'
                      }`}
                    >
                      {file ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="flex items-center gap-3 sm:gap-4"
                        >
                          <motion.div
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-ok rounded-md flex items-center justify-center shrink-0 shadow-e2"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.06 }}
                          >
                            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </motion.div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-semibold text-ink truncate text-sm sm:text-base">{file.name}</p>
                            <p className="text-xs sm:text-sm text-ink-3">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-danger hover:bg-danger-soft transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <div>
                          <div className="w-14 h-14 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4 shadow-e2">
                            <CloudUpload className="w-7 h-7 text-white" />
                          </div>
                          <p className="text-base font-semibold text-ink mb-1">
                            Drag and drop your file here
                          </p>
                          <p className="text-sm text-ink-3 mb-4">or</p>
                          {/* A label, not a button, because it wraps the file input — so it borrows
                              the shared button classes rather than keeping its own. The palette
                              pass had stripped its background and left white text on cream. */}
                          <label className={buttonClasses('primary', 'md', 'cursor-pointer')}>
                            Browse Files
                            <input
                              type="file"
                              onChange={handleFileInput}
                              accept=".csv,.xlsx,.xls"
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-ink-3 mt-4">
                            Supported formats: CSV, XLSX, XLS
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="mt-6 p-3.5 sm:p-4 border border-accent rounded-md">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shrink-0 shadow-e2">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-accent text-sm mb-0.5">File Format</p>
                      <p className="text-accent text-xs leading-relaxed">
                        Your file should have account names in the first column. Headers are optional — only the first column is imported.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="mt-6">
                  <Button
                    type="submit"
                    disabled={uploading || !isReady}
                    variant="primary"
                    size="lg"
                    isLoading={uploading}
                    className={`w-full transition-all duration-300 ${isReady ? ' shadow-e2' : ''}`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Upload Account List
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </PageTransition>
    </main>
  );
}
