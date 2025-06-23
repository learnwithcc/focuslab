export function TestComponent() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'red',
        color: 'white',
        padding: '10px',
        zIndex: 9999,
        border: '2px solid black'
      }}
    >
      TEST COMPONENT IS VISIBLE
    </div>
  );
}