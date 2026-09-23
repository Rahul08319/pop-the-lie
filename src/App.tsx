import { GameArena } from './components/game/GameArena';

const App = () => {
  return (
    <main
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none touch-none overscroll-none bg-[#070a13]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <GameArena />
    </main>
  );
};

export default App;
