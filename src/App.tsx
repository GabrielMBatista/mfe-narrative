
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookOpen, RefreshCw } from 'lucide-react';
import { SettingsProvider } from './contexts/SettingsContext';
import { useStudioOrchestrator } from './hooks/useStudioOrchestrator';

// Components
import Header from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import SocialSeoModule from './components/SocialSeoModule';
import { CenterPanel } from './components/studio/CenterPanel';
import { RightPanel } from './components/studio/RightPanel';
import { StudioModals } from './components/studio/StudioModals';

const StudioApp: React.FC = () => {
  const { state, refs, setters, generated, handlers } = useStudioOrchestrator();

  if (state.showLogin) return <LoginScreen />;

  return (
    <div className="min-h-screen pb-20 bg-slate-950 text-slate-100 selection:bg-amber-500/30">
      <input
        type="file"
        ref={refs.fileInputRef}
        onChange={(e) => e.target.files?.[0] && generated.projectActions.handleImportProject(e.target.files[0])}
        accept=".json"
        className="hidden"
      />

      <div className="relative">
        <Header
          currentNicheId={state.currentNicheId}
          setCurrentNicheId={setters.setCurrentNicheId}
          onImportClick={() => refs.fileInputRef.current?.click()}
          onShowProjects={() => generated.projectActions.setShowProjectsModal(true)}
          onSave={() => generated.projectActions.handleSaveScenery(false)}
          script={state.script}
          activeModule={state.activeModule}
          setActiveModule={setters.setActiveModule}
        />
        <button
          onClick={() => setters.setShowSettings(true)}
          className="fixed bottom-4 right-4 z-50 p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full shadow-lg border border-slate-700 transition-all"
          title="Configurações"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {state.activeModule === 'social' ? (
          <SocialSeoModule
            currentScript={state.script}
            sampleAudios={state.sampleAudios}
          />
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <CenterPanel
              script={state.script} niche={state.niche} status={state.status} error={state.error}
              isNarrationExpanded={state.isNarrationExpanded} setIsNarrationExpanded={setters.setIsNarrationExpanded}
              scriptGeneration={generated.scriptGeneration} assetGeneration={generated.assetGeneration}
              sampleImages={state.sampleImages} sampleAudios={state.sampleAudios}
              projectState={{
                ttsProvider: state.ttsProvider, elevenLabsVoice: state.elevenLabsVoice, availableVoices: state.availableVoices,
                optimizingIndex: state.optimizingIndex, editingPromptIndex: state.editingPromptIndex, tempPrompt: state.tempPrompt,
                characterVoices: state.characterVoices, isReviewingScript: state.isReviewingScript,
                setters: setters
              }}
              handlers={handlers}
              audioPlayer={generated.audioPlayer} videoRender={generated.videoRender} projectActions={generated.projectActions}
            />
            <RightPanel
              script={state.script} projectThumbnail={state.projectThumbnail}
              thumbnailPrompt={state.thumbnailPrompt} setThumbnailPrompt={setters.setThumbnailPrompt}
              isGeneratingThumbnail={state.isGeneratingThumbnail} backgroundMusic={state.backgroundMusic}
              handlers={handlers} characterVoices={state.characterVoices} setCharacterVoices={setters.setCharacterVoices}
              ttsProvider={state.ttsProvider} availableVoices={state.availableVoices}
              thumbnailSuggestions={state.thumbnailSuggestions}
            />
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-800 py-20 text-center text-slate-400">
        <BookOpen className="w-10 h-10 mx-auto text-slate-700 mb-6" />
        <p>Narrative Studio • V4.0</p>
      </footer>

      <StudioModals
        projectActions={generated.projectActions}
        showTranslationModal={state.showTranslationModal} setShowTranslationModal={setters.setShowTranslationModal}
        handlers={handlers} isTranslating={state.isTranslating}
        modalConfig={state.modalConfig} setModalConfig={setters.setModalConfig}
        showVoiceMapping={state.showVoiceMapping} setShowVoiceMapping={setters.setShowVoiceMapping}
        script={state.script} characterVoices={state.characterVoices} setCharacterVoices={setters.setCharacterVoices}
        ttsProvider={state.ttsProvider} availableVoices={state.availableVoices}
        setHasManualVoiceConfig={setters.setHasManualVoiceConfig}
        audioPlayer={generated.audioPlayer} sampleImages={state.sampleImages} sampleAudios={state.sampleAudios}
        showSettings={state.showSettings} setShowSettings={setters.setShowSettings}
        videoRender={generated.videoRender}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <StudioApp />
    </SettingsProvider>
  );
}

export default App;
