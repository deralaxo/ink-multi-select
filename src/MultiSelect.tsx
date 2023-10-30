import React, { useCallback, useEffect, useState } from "react";
import { Box, useStdin } from "ink";
import Indicator from "./components/Indicator.js";
import Item from "./components/Item.js";
import CheckBox from "./components/Checkbox.js";

const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const ENTER = "\r";
const SPACE = " ";

type MultiSelectProps = {
  items: { label: string; value: any; key: string }[];
  selected?: any[];
  defaultSelected?: any[];
  focus?: boolean;
  initialIndex?: number;
  indicatorComponent?: any;
  checkboxComponent?: any;
  itemComponent?: any;
  limit?: number | null;
  onSelect?: (selectedItems: any[]) => void;
  onUnselect?: (unselectedItems: any[]) => void;
  onSubmit?: (selectedItems: any[]) => void;
  onHighlight?: (highlightedIndex: number) => void;
  stdin?: NodeJS.ReadStream;
  setRawMode?: any;
};

const MultiSelect = ({
  items = [],
  selected = [],
  defaultSelected = [],
  focus = true,
  initialIndex = 0,
  indicatorComponent = Indicator,
  checkboxComponent = CheckBox,
  itemComponent = Item,
  limit = null,
  onSelect = () => {},
  onUnselect = () => {},
  onSubmit = () => {},
  onHighlight = () => {},
  stdin,
  setRawMode,
}: MultiSelectProps) => {
  const [rotateIndex, _] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(initialIndex);
  const [selectedItems, setSelectedItems] = useState(
    selected || defaultSelected
  );

  const hasLimit = limit !== null && limit < items.length;

  const slicedItems = hasLimit
    ? items.slice(rotateIndex, rotateIndex + limit)
    : items;

  const handleSelect = (item: any) => {
    if (selectedItems.includes(item)) {
      const newSelectedItems = selectedItems.filter(
        (selectedItem) => selectedItem !== item
      );
      setSelectedItems(newSelectedItems);
      onUnselect([item]);
    } else {
      const newSelectedItems = [...selectedItems, item];
      setSelectedItems(newSelectedItems);
      onSelect([item]);
    }
  };

  const handleHighlight = (index: number) => {
    setHighlightedIndex(index);
    onHighlight(index);
  };

  const handleSubmit = () => {
    onSubmit(selectedItems);
  };

  const handleInput = useCallback(
    (data: Buffer) => {
      const input = data.toString();

      if (input === ARROW_UP) {
        setHighlightedIndex((prevIndex) =>
          prevIndex === 0 ? slicedItems.length - 1 : prevIndex - 1
        );
      } else if (input === ARROW_DOWN) {
        setHighlightedIndex((prevIndex) =>
          prevIndex === slicedItems.length - 1 ? 0 : prevIndex + 1
        );
      } else if (input === ENTER) {
        handleSubmit();
      } else if (input === SPACE) {
        handleSelect(slicedItems[highlightedIndex]);
      }
    },
    [highlightedIndex, handleSubmit, slicedItems, handleSelect]
  );

  useEffect(() => {
    if (focus && stdin && setRawMode) {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.on("data", handleInput);

      return () => {
        stdin.removeListener("data", handleInput);
        stdin.setRawMode(false);
        stdin.pause();
      };
    }

    return () => {};
  }, [focus, stdin, setRawMode, handleInput]);

  return (
    <Box flexDirection="column">
      {slicedItems.map((item, index) => {
        const key = item.key || item.value;
        const isHighlighted = index === highlightedIndex;
        const isSelected = selectedItems.includes(item);

        return (
          <Box key={key}>
            {React.createElement(indicatorComponent, { isHighlighted })}
            {React.createElement(checkboxComponent, { isSelected })}
            {React.createElement(itemComponent, {
              ...item,
              isHighlighted,
              onSelect: () => handleSelect(item),
              onHighlight: () => handleHighlight(index),
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export default (props: MultiSelectProps) => {
  const { stdin, setRawMode } = useStdin();
  return <MultiSelect {...props} stdin={stdin} setRawMode={setRawMode} />;
};

export { Indicator, Item, CheckBox };
