export function Lighting() {
  return (
    <>
      {/* Main directional light (sun) */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Ambient light for fill */}
      <ambientLight intensity={0.5} color="#F0F2FF" />

      {/* Accent light from side */}
      <pointLight position={[20, 10, 0]} intensity={0.3} color="#F9701F" />

      {/* Cool fill light from other side */}
      <pointLight position={[-20, 10, 0]} intensity={0.2} color="#6366f1" />
    </>
  );
}
