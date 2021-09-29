export class ImageItem {
    id: number;
    image: string;
    tournaments: number;
    votes: number;
    descriptor: number[];
    landmarks: number[];
    gender_age: {gender: string; genderProbability: number; age: number};
    geolocation: number[];
    place_name?: string;
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
        } else {
            return ImageItem.normality(item, 4) * 0.4 + (
                ImageItem.normality(item, 0) +
                ImageItem.normality(item, 1) +
                ImageItem.normality(item, 2) +
                ImageItem.normality(item, 3)
            ) * 0.15;
        }
        let iv = item[v];
        let it = item[t];
        if (feature === 4) {
            iv += item.votes - item.votes_0 - item.votes_1 - item.votes_2 - item.votes_3 - item.votes_4;
            it += item.tournaments - item.tournaments_0 - item.tournaments_1 - item.tournaments_2 - item.tournaments_3 - item.tournaments_4;
        }
        return (iv + 0.5) / (it + 1);
    }

    public static normalityText(item: ImageItem, feature?: number) {
        const score = ImageItem.normality(item, feature);
        if (Number.isFinite(feature) && score === 0.5) {
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