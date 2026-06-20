import { useState } from "react";
import { FlatList, Image, View } from "react-native";
import { cn } from "@/lib/utils";

/** Horizontal, swipeable image strip with paging + dot indicators. */
export function EventImageCarousel({
  images,
  height = 176,
}: {
  images: string[];
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height }}
      className="bg-zinc-100"
    >
      {width > 0 && (
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, i) => `${i}-${uri}`}
          onMomentumScrollEnd={(e) =>
            setActive(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={({ item }) => (
            <Image source={{ uri: item }} resizeMode="cover" style={{ width, height }} />
          )}
        />
      )}

      {images.length > 1 && (
        <View className="absolute inset-x-0 bottom-2 flex-row items-center justify-center gap-1.5">
          {images.map((_, i) => (
            <View
              key={i}
              className={cn(
                "h-1.5 rounded-full bg-white",
                i === active ? "w-4" : "w-1.5 opacity-60"
              )}
            />
          ))}
        </View>
      )}
    </View>
  );
}
