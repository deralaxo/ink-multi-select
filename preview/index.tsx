import { render, useApp } from "ink";
import React from "react";
import MultiSelect from "../src/MultiSelect.js";

const Demo = () => {
  const app = useApp();

  const items = [
    {
      label: "Item 1",
      value: "item1",
      key: "item1",
    },
    {
      label: "Item 2",
      value: "item2",
      key: "item2",
    },
  ];
  return (
    <>
      <MultiSelect items={items} onSubmit={() => app.exit()} />
    </>
  );
};

render(<Demo />);
