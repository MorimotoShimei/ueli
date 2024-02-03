import { useFavorites, useSetting } from "@Core/Hooks";
import type { SearchResultItem } from "@common/Core";
import { Caption1, Card, CardHeader, CardPreview, Text } from "@fluentui/react-components";
import { useTranslation } from "react-i18next";

type FavoritesListProps = {
    invokeSearchResultItem: (s: SearchResultItem) => Promise<void>;
};

const getGridTemplateColumns = (numberOfColumns: number) => {
    const result = [];

    for (let i = 0; i < numberOfColumns; i++) {
        result.push("1fr");
    }

    return result.join(" ");
};

export const FavoritesList = ({ invokeSearchResultItem }: FavoritesListProps) => {
    const { t } = useTranslation();
    const { favorites } = useFavorites();

    const { value: numberOfColumns } = useSetting("favorites.numberOfColumns", 3);

    return (
        <div
            style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: getGridTemplateColumns(numberOfColumns),
                gap: 10,
                padding: 20,
                boxSizing: "border-box",
            }}
        >
            {!favorites.length ? <>Favorites</> : null}

            {favorites.map((favorite) => (
                <Card
                    key={`favorite-${favorite.id}`}
                    selected={false}
                    orientation="horizontal"
                    onClick={() => invokeSearchResultItem(favorite)}
                    onKeyDown={(e) => e.key === "Enter" && invokeSearchResultItem(favorite)}
                >
                    <CardPreview style={{ paddingLeft: 12, width: 24 }}>
                        <img style={{ width: "100%" }} src={favorite.imageUrl} alt="App Name Document" />
                    </CardPreview>
                    <CardHeader
                        header={<Text weight="semibold">{favorite.name}</Text>}
                        description={
                            <Caption1>
                                {favorite.descriptionTranslation
                                    ? t(favorite.descriptionTranslation.key, {
                                          ns: favorite.descriptionTranslation.namespace,
                                      })
                                    : favorite.description}
                            </Caption1>
                        }
                    />
                </Card>
            ))}
        </div>
    );
};
