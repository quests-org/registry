import { RPCDemo } from "./components/demo/rpc";

function App() {
  return (
    <div className="h-full w-full">
      {window.location.pathname === "/demo/rpc" && <RPCDemo />}
    </div>
  );
}

export default App;
