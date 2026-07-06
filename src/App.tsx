import Scene from "./components/Scene";
import BroadcastOverlay from "./components/BroadcastOverlay";

export default function App() {
  return (
    <main 
      id="main-app" 
      className="relative w-screen h-screen overflow-hidden bg-[#020408]"
    >
      {/* 3D WebGL Earth Stage */}
      <Scene />

      {/* Cinematic Ambient Vignette Edge Shadow Overlay */}
      <div 
        id="cinematic-vignette" 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,4,8,0.7)_100%)] z-[5]" 
      />

      {/* Modern High-End Cinematic HTML Overlay */}
      <BroadcastOverlay />
    </main>
  );
}
