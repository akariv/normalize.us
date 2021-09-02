export class ImageItem {
    id: number;
    image: string;
    tournaments: number;
    votes: number;
    descriptor: number[];
    landmarks: number[];
    gender_age: {gender: string; genderProbability: number; age: number};
    geolocation: number[];
    created_timestamp?: string;
    tournaments_0?: number;
    votes_0?: number;
    tournaments_1?: number;
    votes_1?: number;
    tournaments_2?: number;
    votes_2?: number;
    tournaments_3?: number;
    votes_3?: number;
    tournaments_4?: number;
    votes_4?: number;

    public static normality(item: ImageItem, feature?: number) {
        let v = 'votes';
        let t = 'tournaments';
        if (Number.isFinite(feature)) {
            v += `_${feature}`;
            t += `_${feature}`;
        }
        return (item[v] + 0.5) / (item[t] + 1);
    }

    public static normalityText(item: ImageItem, feature?: number) {
        const score = ImageItem.normality(item, feature);
        if (score === 0.5) {
            return 'N/A';
        }
        return score.toFixed(2);
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