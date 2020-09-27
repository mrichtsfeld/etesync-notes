// SPDX-FileCopyrightText: © 2019 EteSync Authors
// SPDX-License-Identifier: GPL-3.0-only

import * as React from "react";
import moment from "moment";
import { StyleSheet, FlatList, View } from "react-native";
import { Menu, Appbar, List, useTheme, FAB } from "react-native-paper";
import { useNavigation, RouteProp } from "@react-navigation/native";

import { useSyncGate } from "../SyncGate";
import { CachedItem } from "../store";

import { SyncManager } from "../sync/SyncManager";
import { useAsyncDispatch } from "../store";
import { performSync } from "../store/actions";
import { useCredentials } from "../credentials";


type RootStackParamList = {
  NoteListScreen: {
    colUid?: string;
  };
};

interface PropsType {
  route: RouteProp<RootStackParamList, "NoteListScreen">;
}

export default function NoteListScreen(props: PropsType) {
  const etebase = useCredentials()!;
  const dispatch = useAsyncDispatch();
  const navigation = useNavigation();
  const syncGate = useSyncGate();
  const theme = useTheme();

  React.useEffect(() => {
    function RightAction() {
      const [showMenu, setShowMenu] = React.useState(false);

      return (
        <View style={{ flexDirection: "row" }}>
          <Appbar.Action icon="sort" accessibilityLabel="Sort" onPress={() => setShowMenu(true)} />
          <Menu
            visible={showMenu}
            onDismiss={() => setShowMenu(false)}
            anchor={(
              <Appbar.Action icon="dots-vertical" accessibilityLabel="Menu" onPress={() => setShowMenu(true)} />
            )}
          >
            <Menu.Item icon="notebook" title="New Notebook"
              onPress={() => {
                setShowMenu(false);
                navigation.navigate("CollectionEdit", { colUid });
              }}
            />
            <Menu.Item icon="sync" title="Sync"
              onPress={() => {
                const syncManager = SyncManager.getManager(etebase);
                dispatch(performSync(syncManager.sync())); // not awaiting on puprose
              }}
            />
          </Menu>
        </View>
      );
    }

    navigation.setOptions({
      headerRight: () => (
        <RightAction />
      ),
    });
  }, [navigation]);

  if (syncGate) {
    return syncGate;
  }

  const colUid = props.route.params?.colUid ?? "";

  const entriesList: any[] = [];

  function renderEntry(param: { item: CachedItem & { uid: string } }) {
    const item = param.item;
    const name = item.meta.name!;
    const mtime = (item.meta.mtime) ? moment(item.meta.mtime) : undefined;

    return (
      <List.Item
        key={item.uid}
        title={name}
        description={mtime?.format("llll")}
        onPress={() => { navigation.navigate("Note", { colUid, itemUid: item.uid }) }}
      />
    );
  }

  return (
    <>
      <FlatList
        style={[{ backgroundColor: theme.colors.background }, { flex: 1 }]}
        data={entriesList}
        keyExtractor={(item) => item.uid}
        renderItem={renderEntry}
        maxToRenderPerBatch={10}
      />
      <FAB
        icon="plus"
        accessibilityLabel="New"
        color="white"
        style={styles.fab}
        onPress={() => navigation.navigate("ItemEdit", { colUid })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});