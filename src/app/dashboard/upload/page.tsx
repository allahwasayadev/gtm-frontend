'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { Button, DashboardHeader, PageTransition } from '@/components/ui';
import { CloudUpload, Check, Info, FileSpreadsheet, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return null;
  }

  const isReady = !!file && !!listName.trim();

  return (
    <>
      <DashboardHeader
        title="Upload Account List"
        description="Import your accounts from CSV or Excel"
        backHref="/dashboard"
      />

      <main className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageTransition>
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-linear-to-br from-indigo-600 via-indigo-500 to-violet-500 px-5 sm:px-8 py-5 sm:py-6 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
                <div className="relative flex items-center gap-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-indigo-700/30">
                    <CloudUpload className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Import Accounts</h2>
                    <p className="text-indigo-200 text-xs sm:text-sm">Upload a spreadsheet with your account names</p>
                  </div>
                </div>
              </div>

              {/* Steps Body */}
              <div className="px-5 sm:px-8 py-6">
                {/* Step 1: Name */}
                <div className="flex gap-4 sm:gap-5">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-md transition-all duration-300 ${
                      listName.trim()
                        ? 'bg-linear-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-indigo-500/20'
                    }`}>
                      {listName.trim() ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <div className={`w-px flex-1 mt-3 transition-colors duration-300 ${listName.trim() ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="font-semibold text-slate-900 mb-0.5">Name your list</h3>
                    <p className="text-sm text-slate-500 mb-4">Choose a descriptive name for easy identification</p>
                    <input
                      type="text"
                      required
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="e.g., Q1 2025 Target Accounts"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:shadow-sm transition-all text-slate-900 placeholder-slate-400 bg-white"
                    />
                  </div>
                </div>

                {/* Step 2: File */}
                <div className="flex gap-4 sm:gap-5">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-md transition-all duration-300 ${
                      file
                        ? 'bg-linear-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-500/20'
                        : 'bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-indigo-500/20'
                    }`}>
                      {file ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-0.5">Choose your file</h3>
                    <p className="text-sm text-slate-500 mb-4">Drag and drop or browse for a spreadsheet</p>

                    {/* Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl text-center transition-all duration-200 ${
                        dragActive
                          ? 'border-indigo-500 bg-indigo-50/80 shadow-lg shadow-indigo-500/10 p-6 sm:p-10'
                          : file
                            ? 'border-emerald-200 bg-emerald-50/30 p-4'
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 p-6 sm:p-10'
                      }`}
                    >
                      {file ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="flex items-center gap-3 sm:gap-4"
                        >
                          <motion.div
                            className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                          >
                            <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </motion.div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate text-sm sm:text-base">{file.name}</p>
                            <p className="text-xs sm:text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <div>
                          <div className="w-14 h-14 bg-linear-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                            <CloudUpload className="w-7 h-7 text-white" />
                          </div>
                          <p className="text-base font-semibold text-slate-900 mb-1">
                            Drag and drop your file here
                          </p>
                          <p className="text-sm text-slate-400 mb-4">or</p>
                          <label className="cursor-pointer inline-flex items-center justify-center px-5 py-2.5 bg-linear-to-r from-indigo-600 to-indigo-500 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-indigo-600 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                            Browse Files
                            <input
                              type="file"
                              onChange={handleFileInput}
                              accept=".csv,.xlsx,.xls"
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-slate-400 mt-4">
                            Supported formats: CSV, XLSX, XLS
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="mt-6 p-3.5 sm:p-4 bg-linear-to-r from-sky-50 to-blue-50 border border-sky-200/60 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-linear-to-br from-sky-400 to-blue-500 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-sky-500/15">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sky-900 text-sm mb-0.5">File Format</p>
                      <p className="text-sky-700/80 text-xs leading-relaxed">
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
                    className={`w-full transition-all duration-300 ${isReady ? 'shadow-lg shadow-indigo-500/25' : ''}`}
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
    </>
  );
}
