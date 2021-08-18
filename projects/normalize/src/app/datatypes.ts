export class ImageItem {
    id: string;
    image: string;
    tournaments: number;
    votes: number;
    descriptor: number[];
    landmarks: number[];
    gender_age: {gender: string; genderProbability: number; age: number};

    public static normality(item: ImageItem) {
        return (item.votes + 0.5) / (item.tournaments + 1);
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