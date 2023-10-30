import React, { useCallback, useEffect, useState } from "react";
import { Box, useStdin } from "ink";
import Indicator from "./components/Indicator.js";
import ItemComponent from "./components/Item.js";
import CheckBox from "./components/Checkbox.js";

const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const ENTER = "\r";
const SPACE = " ";

type Item<T> = {
  label: string;
  value: T;
};

type MultiSelectProps<T> = {
  items: Item<T>[];
  defaultSelected?: Item<T>[];
  focus?: boolean;
  initialIndex?: number;
  indicatorComponent?: React.FC<{ isHighlighted: boolean }>;
  checkboxComponent?: React.FC<{ isSelected: boolean }>;
  itemComponent?: React.FC<{ isHighlighted: boolean; label: string }>;
  limit?: number | null;
  onSelect?: (selectedItem: Item<T>) => void;
  onUnselect?: (unselectedItem: Item<T>) => void;
  onSubmit?: (selectedItems: Item<T>[]) => void;
  onHighlight?: (highlightedItem: Item<T>) => void;
  stdin?: NodeJS.ReadStream;
  setRawMode?: (value: boolean) => void;
};

const MultiSelect = function <T>({
  items = [],
  defaultSelected = [],
  focus = true,
  initialIndex = 0,
  indicatorComponent = Indicator,
  checkboxComponent = CheckBox,
  itemComponent = ItemComponent,
  limit = null,
  onSelect = () => {},
  onUnselect = () => {},
  onSubmit = () => {},
  onHighlight = () => {},
}: MultiSelectProps<T>) {
  const [highlightedIndex, setHighlightedIndex] = useState(initialIndex);
  const [selectedItems, setSelectedItems] = useState(defaultSelected);

  const { stdin, setRawMode } = useStdin();

  const hasLimit = limit !== null && limit < items.length;

  const slicedItems = hasLimit ? items.slice(0, limit) : items;

  const handleSelect = useCallback(
    (item: Item<T>) => {
      if (selectedItems.includes(item)) {
        const newSelectedItems = selectedItems.filter(
          (selectedItem) => selectedItem !== item
        );
        setSelectedItems(newSelectedItems);
        onUnselect(item);
      } else {
        const newSelectedItems = [...selectedItems, item];
        setSelectedItems(newSelectedItems);
        onSelect(item);
      }
    },
    [selectedItems, onSelect, onUnselect]
  );

  const handleSubmit = useCallback(() => {
    onSubmit(selectedItems);
  }, [selectedItems, onSubmit]);

  const handleInput = useCallback(
    (data: Buffer) => {
      const input = data.toString();

      if (input === ARROW_UP) {
        setHighlightedIndex((prevIndex) => {
          const index =
            prevIndex === 0 ? slicedItems.length - 1 : prevIndex - 1;
          onHighlight(slicedItems[index]!);
          return index;
        });
      } else if (input === ARROW_DOWN) {
        setHighlightedIndex((prevIndex) => {
          const index =
            prevIndex === slicedItems.length - 1 ? 0 : prevIndex + 1;
          onHighlight(slicedItems[index]!);
          return index;
        });
      } else if (input === ENTER) {
        handleSubmit();
      } else if (input === SPACE) {
        handleSelect(slicedItems[highlightedIndex]!);
      }
    },
    [highlightedIndex, handleSubmit, slicedItems, handleSelect, onHighlight, setHighlightedIndex]
  );

  useEffect(() => {
    if (focus && stdin) {
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
        const key = index;
        const isHighlighted = index === highlightedIndex;
        const isSelected = selectedItems.includes(item);

        return (
          <Box key={key}>
            {React.createElement(indicatorComponent, { isHighlighted })}
            {React.createElement(checkboxComponent, { isSelected })}
            {React.createElement(itemComponent, {
              ...item,
              isHighlighted,
            })}
          </Box>
        );
      })}
    </Box>
  );
};

export default MultiSelect;

export { Indicator, ItemComponent, CheckBox, Item };
