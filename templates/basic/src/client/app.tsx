import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./rpc-client";

function App() {
  const { data } = useQuery(
    queryClient.hello.sayHello.queryOptions({
      input: {
        name: "Quests",
      },
    })
  );

  return (
    <div className="h-full w-full flex items-center justify-center">
      <h1>{data}</h1>
    </div>
  );
}

export default App;
