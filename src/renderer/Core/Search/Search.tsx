import {
    SearchResultItemActionUtility,
    type ExcludedSearchResultItem,
    type SearchResultItem,
    type SearchResultItemAction,
} from "@common/Core";
import { Button, Input } from "@fluentui/react-components";
import { SearchRegular, SettingsRegular } from "@fluentui/react-icons";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { BaseLayout } from "../BaseLayout";
import { Footer } from "../Footer";
import { useContextBridge, useSetting } from "../Hooks";
import { ActionsMenu } from "./ActionsMenu";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { FavoritesList } from "./FavoritesList";
import { filterSearchResultItemsBySearchTerm } from "./Helpers";
import type { KeyboardEventHandler } from "./KeyboardEventHandler";
import { SearchResultList } from "./SearchResultList";

type SearchProps = {
    searchResultItems: SearchResultItem[];
    excludedSearchResultItems: ExcludedSearchResultItem[];
    favorites: SearchResultItem[];
};

export const Search = ({ searchResultItems, excludedSearchResultItems, favorites }: SearchProps) => {
    const { t } = useTranslation();
    const { contextBridge } = useContextBridge();
    const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [confirmationDialogAction, setConfirmationDialogAction] = useState<SearchResultItemAction | undefined>(
        undefined,
    );
    const userInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const additionalActionsButtonRef = useRef<HTMLButtonElement>(null);
    const [additionalActions, setAdditionalActions] = useState<SearchResultItemAction[]>([]);

    const setFocusOnUserInput = () => {
        userInputRef?.current?.focus();
    };

    const setFocusOnUserInputAndSelectText = () => {
        userInputRef?.current?.focus();
        userInputRef?.current?.select();
    };

    const navigate = useNavigate();
    const openSettings = () => navigate({ pathname: "/settings/general" });
    const search = (updatedSearchTerm: string) => setSearchTerm(updatedSearchTerm);

    const { value: fuzziness } = useSetting("searchEngine.fuzziness", 0.5);
    const { value: maxResultLength } = useSetting("searchEngine.maxResultLength", 50);

    const filteredSearchResultItems = filterSearchResultItemsBySearchTerm({
        searchResultItems,
        excludedSearchResultItems,
        searchOptions: { searchTerm, fuzziness, maxResultLength },
    });

    const selectNextSearchResultItem = () =>
        setSelectedItemIndex(selectedItemIndex === filteredSearchResultItems.length - 1 ? 0 : selectedItemIndex + 1);

    const selectPreviousSearchResultItem = () =>
        setSelectedItemIndex(selectedItemIndex === 0 ? filteredSearchResultItems.length - 1 : selectedItemIndex - 1);

    const selectFirstSearchResultItemItem = () => setSelectedItemIndex(0);

    const getSelectedSearchResultItem = (): SearchResultItem | undefined =>
        filteredSearchResultItems[selectedItemIndex];

    const invokeSelectedSearchResultItem = async () => {
        const searchResultItem = getSelectedSearchResultItem();

        if (!searchResultItem || !searchResultItem.defaultAction) {
            return;
        }

        await invokeAction(searchResultItem.defaultAction);
    };

    const invokeAction = async (action: SearchResultItemAction) => {
        if (!action.requiresConfirmation) {
            await contextBridge.invokeAction(action);
            return;
        }

        // This timeout is a workaround. Without it, for some reason the close button in the confirmation dialog will
        // trigger an "onClick" event and therefore will be closed immediately.
        setTimeout(() => setConfirmationDialogAction(action), 100);
    };

    const handleUserInputKeyDownEvent = (keyboardEvent: KeyboardEvent<HTMLElement>) => {
        const eventHandlers: KeyboardEventHandler[] = [
            {
                listener: (e) => {
                    e.preventDefault();
                    selectPreviousSearchResultItem();
                },
                needsToInvokeListener: (keyboardEvent) => keyboardEvent.key === "ArrowUp",
            },
            {
                listener: (e) => {
                    e.preventDefault();
                    selectNextSearchResultItem();
                },
                needsToInvokeListener: (e) => e.key === "ArrowDown",
            },
            {
                listener: (e) => {
                    e.preventDefault();
                    additionalActionsButtonRef.current?.click();
                },
                needsToInvokeListener: (e) => e.key === "k" && (e.metaKey || e.ctrlKey),
            },
            {
                listener: async (e) => {
                    e.preventDefault();
                    await invokeSelectedSearchResultItem();
                },
                needsToInvokeListener: (e) => e.key === "Enter",
            },
        ];

        for (const eventHandler of eventHandlers) {
            if (eventHandler.needsToInvokeListener(keyboardEvent)) {
                eventHandler.listener(keyboardEvent);
            }
        }
    };

    const handleSearchResultItemClickEvent = (index: number) => setSelectedItemIndex(index);

    const handleSearchResultItemDoubleClickEvent = (searchResultItem: SearchResultItem) =>
        searchResultItem.defaultAction && invokeAction(searchResultItem.defaultAction);

    const updateAdditionalActions = () => {
        const searchResultItem = getSelectedSearchResultItem();

        if (!searchResultItem) {
            setAdditionalActions([]);
            return;
        }

        const defaultAdditionalActions = [
            favorites.find((f) => f.id === searchResultItem.id)
                ? SearchResultItemActionUtility.createRemoveFromFavoritesAction({ id: searchResultItem.id })
                : SearchResultItemActionUtility.createAddToFavoritesAction(searchResultItem),
            SearchResultItemActionUtility.createExcludeFromSearchResultsAction(searchResultItem),
        ];

        setAdditionalActions([
            searchResultItem.defaultAction,
            ...defaultAdditionalActions,
            ...(searchResultItem.additionalActions ?? []),
        ]);
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialogAction(undefined);
        setFocusOnUserInput();
    };

    useEffect(() => {
        setFocusOnUserInputAndSelectText();
        contextBridge.ipcRenderer.on("windowFocused", () => setFocusOnUserInputAndSelectText());
    }, []);

    useEffect(() => selectFirstSearchResultItemItem(), [searchTerm]);
    useEffect(() => updateAdditionalActions(), [selectedItemIndex, searchTerm, excludedSearchResultItems, favorites]);

    return (
        <BaseLayout
            header={
                <div
                    className="draggable-area"
                    style={{
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                        padding: 10,
                    }}
                >
                    <Input
                        className="non-draggable-area"
                        ref={userInputRef}
                        appearance={
                            contextBridge.themeShouldUseDarkColors() ? "filled-darker-shadow" : "filled-lighter-shadow"
                        }
                        size="large"
                        value={searchTerm}
                        onChange={(_, { value }) => search(value)}
                        onKeyDown={handleUserInputKeyDownEvent}
                        contentBefore={<SearchRegular />}
                        placeholder={t("placeholder", { ns: "search" })}
                    />
                </div>
            }
            contentRef={containerRef}
            content={
                <>
                    <ConfirmationDialog closeDialog={closeConfirmationDialog} action={confirmationDialogAction} />
                    {!searchTerm.length ? (
                        <FavoritesList invokeSearchResultItem={({ defaultAction }) => invokeAction(defaultAction)} />
                    ) : (
                        <SearchResultList
                            containerRef={containerRef}
                            selectedItemIndex={selectedItemIndex}
                            searchResultItems={filteredSearchResultItems}
                            searchTerm={searchTerm}
                            onSearchResultItemClick={handleSearchResultItemClickEvent}
                            onSearchResultItemDoubleClick={handleSearchResultItemDoubleClickEvent}
                        />
                    )}
                </>
            }
            footer={
                <Footer draggable>
                    <Button
                        className="non-draggable-area"
                        onClick={openSettings}
                        size="small"
                        appearance="subtle"
                        icon={<SettingsRegular fontSize={14} />}
                    >
                        {t("settings", { ns: "general" })}
                    </Button>
                    <ActionsMenu
                        actions={additionalActions}
                        invokeAction={invokeAction}
                        additionalActionsButtonRef={additionalActionsButtonRef}
                        onMenuClosed={() => setFocusOnUserInput()}
                    />
                </Footer>
            }
        />
    );
};
