import { usePlatform } from '@/platforms/platformManager';
import { PlatformId } from '@/platforms/types';
import { playButtonClick } from '@/game/audioManager';

interface Props {
  onClose: () => void;
}

export function PlatformSelectorModal({ onClose }: Props) {
  const { platformId, setPlatform, allPlatforms } = usePlatform();

  const handleSelect = (id: PlatformId) => {
    playButtonClick();
    setPlatform(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-spring-in">
      <div className="relative w-full max-w-md bg-[#1c1c1e]/90 border border-white/15 rounded-[22px] p-6 text-white shadow-2xl backdrop-blur-2xl">
        {/* Apple modal header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold font-apple-display tracking-tight text-white">Platform Environment</h2>
            <p className="text-xs text-white/60">Zero-Playgama Multi-Platform Bridge</p>
          </div>
          <button
            onClick={() => { playButtonClick(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-95 transition-transform"
          >
            ✕
          </button>
        </div>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 max-h-[60vh] overflow-y-auto pr-1">
          {allPlatforms.map((p) => {
            const isSelected = p.id === platformId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all active:scale-[0.97] ${
                  isSelected
                    ? 'bg-[#0066cc] border-[#2997ff] text-white shadow-md'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-semibold">{p.name}</span>
                  {isSelected && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-[9px] opacity-75">
                  {p.capabilities.hasAds && <span>• Ads</span>}
                  {p.capabilities.hasRewardedAds && <span>• Rewarded</span>}
                  {p.capabilities.hasCloudSave && <span>• Cloud</span>}
                  {p.capabilities.hasAudioSync && <span>• AudioSync</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info footer */}
        <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/50 text-center">
          SDK runs automatically in its respective native environment or simulates seamlessly in browser.
        </div>
      </div>
    </div>
  );
}
