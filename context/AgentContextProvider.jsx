const { createContext, useState } = require("react");

export const AgentContext = createContext(null);

export const AgentContextProvider = ({ children }) => {
  const [modifyPayment, setModifyPayment] = useState(false);
  return (
    <AgentContext.Provider value={{ modifyPayment, setModifyPayment }}>
      {children}
    </AgentContext.Provider>
  );
};
