import React, { useState, useEffect } from 'react';
import { store } from './lib/store.ts';
import { CodeItem, ProjectItem, NfcWriteRecord, ScanEvent, UserProfile, CodeType } from './types.ts';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { QrManagerView } from './components/QrManagerView.tsx';
import { NfcManagerView } from './components/NfcManagerView.tsx';
import { AndroidNfcWriterView } from './components/AndroidNfcWriterView.tsx';
import { BarcodeManagerView } from './components/BarcodeManagerView.tsx';
import { ProjectsView } from './components/ProjectsView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { BulkGeneratorView } from './components/BulkGeneratorView.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { CreateCodeModal } from './components/CreateCodeModal.tsx';
import { CodeDetailModal } from './components/CodeDetailModal.tsx';
import { PublicRedirectLanding } from './components/PublicRedirectLanding.tsx';

export default function App() {
  // Check for public redirect routes: /q/{id}, /n/{id}, /b/{id}
  const [redirectRoute, setRedirectRoute] = useState<{
    type: 'qr' | 'nfc' | 'barcode';
    id: string;
  } | null>(null);

  // Store data state
  const [codes, setCodes] = useState<CodeItem[]>(store.getCodes());
  const [projects, setProjects] = useState<ProjectItem[]>(store.getProjects());
  const [nfcWrites, setNfcWrites] = useState<NfcWriteRecord[]>(store.getNfcWrites());
  const [scans, setScans] = useState<ScanEvent[]>(store.getScans());
  const [user, setUser] = useState<UserProfile>(store.getUser());

  // UI state
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalDefaultType, setCreateModalDefaultType] = useState<CodeType>('qr');
  const [createModalDefaultBarcode, setCreateModalDefaultBarcode] = useState('');
  const [selectedCodeForDetail, setSelectedCodeForDetail] = useState<CodeItem | null>(null);
  const [writerSelectedCodeId, setWriterSelectedCodeId] = useState<string | undefined>(undefined);

  // Check URL pathname for /q/:id, /n/:id, /b/:id
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/(q|n|b)\/([a-zA-Z0-9\-_]+)/i);
    if (match) {
      const typeKey = match[1].toLowerCase();
      const codeType = typeKey === 'q' ? 'qr' : typeKey === 'n' ? 'nfc' : 'barcode';
      setRedirectRoute({ type: codeType, id: match[2] });
    }
  }, []);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setCodes(store.getCodes());
      setProjects(store.getProjects());
      setNfcWrites(store.getNfcWrites());
      setScans(store.getScans());
      setUser(store.getUser());
    });
    return unsubscribe;
  }, []);

  // If visiting an intermediate link URL, render the clean public redirect landing
  if (redirectRoute) {
    return (
      <PublicRedirectLanding
        type={redirectRoute.type}
        uniqueId={redirectRoute.id}
      />
    );
  }

  // Active counts
  const activeCodeCounts = {
    qr: codes.filter((c) => c.codeType === 'qr').length,
    nfc: codes.filter((c) => c.codeType === 'nfc').length,
    barcode: codes.filter((c) => c.codeType === 'barcode').length,
    total: codes.length
  };

  // Handlers
  const handleOpenCreate = (defaultType?: CodeType) => {
    setCreateModalDefaultType(defaultType || 'qr');
    setCreateModalDefaultBarcode('');
    setIsCreateModalOpen(true);
  };

  const handleOpenNfcWriter = (codeId?: string) => {
    if (codeId) setWriterSelectedCodeId(codeId);
    setCurrentTab('nfc-writer');
  };

  const handleToggleStatus = (codeId: string) => {
    store.toggleCodeStatus(codeId);
  };

  const handleDeleteCode = (codeId: string) => {
    if (confirm('Are you sure you want to delete this code?')) {
      store.deleteCode(codeId);
      if (selectedCodeForDetail?.id === codeId) {
        setSelectedCodeForDetail(null);
      }
    }
  };

  const handleUpdateDestination = (codeId: string, newUrl: string) => {
    store.updateCode(codeId, { destinationUrl: newUrl });
  };

  const handleCreateCode = (codeData: any) => {
    return store.addCode(codeData);
  };

  const handleUpdateCode = (id: string, updates: Partial<CodeItem>) => {
    store.updateCode(id, updates);
    if (selectedCodeForDetail?.id === id) {
      const updated = store.getCodes().find((c) => c.id === id);
      if (updated) setSelectedCodeForDetail(updated);
    }
  };

  const handleCreateProject = (projectData: any) => {
    store.addProject({ ...projectData, userId: user.id });
  };

  const handleUpdateProject = (id: string, updates: Partial<ProjectItem>) => {
    store.updateProject(id, updates);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Delete this project? Codes inside will remain accessible.')) {
      store.deleteProject(id);
    }
  };

  const handleRecordWrite = (record: any) => {
    store.addNfcWrite(record);
  };

  const handleImportBulk = (items: any) => {
    return store.importBulk(items);
  };

  const handleResetFactory = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'scanner') {
            setIsScannerOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        user={user}
        activeCodeCounts={activeCodeCounts}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          currentTab={currentTab}
          onOpenCreate={handleOpenCreate}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenNfcWriter={() => setCurrentTab('nfc-writer')}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              codes={codes}
              scans={scans}
              onOpenCreate={handleOpenCreate}
              onOpenNfcWriter={handleOpenNfcWriter}
              onOpenCodeDetail={(code) => setSelectedCodeForDetail(code)}
              onToggleStatus={handleToggleStatus}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'qr' && (
            <QrManagerView
              codes={codes}
              projects={projects}
              onOpenCreate={handleOpenCreate}
              onOpenCodeDetail={(code) => setSelectedCodeForDetail(code)}
              onToggleStatus={handleToggleStatus}
              onDeleteCode={handleDeleteCode}
              onUpdateDestination={handleUpdateDestination}
            />
          )}

          {currentTab === 'nfc' && (
            <NfcManagerView
              codes={codes}
              projects={projects}
              nfcWrites={nfcWrites}
              onOpenCreate={handleOpenCreate}
              onOpenCodeDetail={(code) => setSelectedCodeForDetail(code)}
              onOpenNfcWriter={handleOpenNfcWriter}
              onToggleStatus={handleToggleStatus}
              onDeleteCode={handleDeleteCode}
              onUpdateDestination={handleUpdateDestination}
            />
          )}

          {currentTab === 'nfc-writer' && (
            <AndroidNfcWriterView
              codes={codes}
              user={user}
              selectedCodeId={writerSelectedCodeId}
              onRecordWrite={handleRecordWrite}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'barcodes' && (
            <BarcodeManagerView
              codes={codes}
              projects={projects}
              onOpenCreate={handleOpenCreate}
              onOpenCodeDetail={(code) => setSelectedCodeForDetail(code)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onToggleStatus={handleToggleStatus}
              onDeleteCode={handleDeleteCode}
              onUpdateDestination={handleUpdateDestination}
            />
          )}

          {currentTab === 'projects' && (
            <ProjectsView
              projects={projects}
              codes={codes}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onOpenCodeDetail={(code) => setSelectedCodeForDetail(code)}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView scans={scans} codes={codes} />
          )}

          {currentTab === 'bulk' && (
            <BulkGeneratorView
              projects={projects}
              onImportBulk={handleImportBulk}
              allCodes={codes}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              codes={codes}
              onUpdateUser={(u) => store.setUser(u)}
              onResetFactoryData={handleResetFactory}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {isCreateModalOpen && (
        <CreateCodeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          defaultType={createModalDefaultType}
          defaultBarcodeNumber={createModalDefaultBarcode}
          projects={projects}
          onCreateCode={handleCreateCode}
        />
      )}

      {selectedCodeForDetail && (
        <CodeDetailModal
          code={selectedCodeForDetail}
          onClose={() => setSelectedCodeForDetail(null)}
          onUpdateCode={handleUpdateCode}
          onToggleStatus={handleToggleStatus}
          onOpenNfcWriter={handleOpenNfcWriter}
        />
      )}

      {isScannerOpen && (
        <ScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          codes={codes}
          onOpenCodeDetail={(code) => setSelectedCodeForDetail(code)}
          onRecordScan={(id, type) => store.recordScan(id, type)}
          onQuickCreateBarcode={(scannedNum) => {
            setCreateModalDefaultType('barcode');
            setCreateModalDefaultBarcode(scannedNum);
            setIsCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
