export class ImageItem {
    id: string;
    image: string;
    tournaments: number;
    votes: number;
    descriptor: number[];
    landmarks: number[];
    gender_age: {gender: string; genderProbability: number; age: number};
    geolocation: number[];
    created_timestamp?: string;

    public static normality(item: ImageItem, feature?: number) {
        let v = 'votes';
        let t = 'tournaments';
        if (Number.isFinite(feature)) {
            v += `_${feature}`;
            t += `_${feature}`;
        }
        return (item[v] + 0.5) / (item[t] + 1);
    }
}

export class GridItem {
    pos: {
        x: number;
        y: number;
    };
    item: ImageItem;

    public static normality(item: GridItem) {
        return ImageItem.normality(item.item);
    }
}