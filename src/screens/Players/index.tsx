import { Header } from "@components/Header";
import { Container, Form, HeaderList, NumberOfPlayers } from "./styles";
import { Highlight } from "@components/Highlight";
import { ButtonIcon } from "@components/ButtonIcon";
import { Input } from "@components/Input";
import { Filter } from "@components/Filter";
import { Alert, FlatList, TextInput } from "react-native";
import { useEffect, useState, useRef } from "react";
import { PlayerCard } from "@components/PlayerCard";
import { ListEmpty } from "@components/ListEmpty";
import { Button } from "@components/Button";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppError } from "@utils/AppError";
import { playerAddByGroup } from "@storage/player/playerAddByGroup";
import { playersGetByGroupAndTeam } from "@storage/player/playersGetByGroupAndTeam";
import { PlayerStorageDTO } from "@storage/player/PlayerStorageDTO";
import { playerRemoveByGroup } from "@storage/player/playerRemoveByGroup";
import { groupRemoveByName } from "@storage/group/groupRemoveByName";
import { Loading } from "@components/Loading";

type RouteParams = {
    group: string;
}

export function Players() {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [newPlayerName, setNewPlayerName] = useState<string>('');
    const [team, setTeam] = useState<string>('Time A');
    const [players, setPlayers] = useState<PlayerStorageDTO[]>([]);
    const route = useRoute();
    const { group } = route.params as RouteParams;
    const navigation = useNavigation();

    const newPlayerNameInputRef = useRef<TextInput>(null);

    async function handleAddPlayer() {
        if(newPlayerName.trim().length === 0) {
            return Alert.alert('Novo Jogador', 'Informe o nome do jogador.');
        }

        const newPlayer = {
            name: newPlayerName,
            team,
        }

        try {
            await playerAddByGroup(newPlayer, group);
            newPlayerNameInputRef.current?.blur();
            setNewPlayerName('');
            fetchPlayersByTeam();
        } catch(error) {
            if(error instanceof AppError) {
                Alert.alert('Novo Jogador', error.message);
            } else {
                Alert.alert('Novo Jogador', 'Não foi possível adicionar o jogador');
                console.log(error);
            }
        }
    }

    async function fetchPlayersByTeam() {
        try {
            setIsLoading(true);
            const playersByTeam = await playersGetByGroupAndTeam(group, team);
            setPlayers(playersByTeam);
        } catch(error) {
            console.log(error);
            Alert.alert('Jogadores', 'Não foi possível carregar os jogadores');
        } finally {
            setIsLoading(false);
        }
    }

    async function groupRemove() {
        try {
            await groupRemoveByName(group);
            navigation.navigate('groups');
        } catch(error) {
            Alert.alert('Remover Turma', 'Não foi possível remover a turma');
            console.log(error);
        }
    }

    async function  handleGroupRemove() {
        Alert.alert('Remover Turma', 'Deseja realmente remover a turma?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', onPress: () => groupRemove() }
        ])
    }

    async function handleRemovePlayer(playerName: string) {
        try {
            await playerRemoveByGroup(playerName, group);
            fetchPlayersByTeam();
        } catch(error) {
            Alert.alert('Remover pessoa', 'Não foi possível remover o jogador');
            console.log(error);
        }
    }

    useEffect(() => {
        fetchPlayersByTeam();
    },[team])

    return(
        <Container>
            <Header showBackButton />
            <Highlight title={group} subtitle="Adicione a galera e separe os times" />
            <Form>
                <Input 
                    inputRef={newPlayerNameInputRef} 
                    placeholder="Nome da pessoa" 
                    autoCorrect={false} 
                    onChangeText={setNewPlayerName} 
                    value={newPlayerName} 
                    onSubmitEditing={handleAddPlayer}
                    returnKeyType="done"
                />
                <ButtonIcon icon="add" onPress={handleAddPlayer}/>
            </Form>
            <HeaderList>
                <FlatList 
                    data={['Time A', 'Time B']}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                        <Filter title={item} isActive={item === team} onPress={() => setTeam(item)}/>
                    )}
                    horizontal
                />
                <NumberOfPlayers>
                    {players.length}
                </NumberOfPlayers>
            </HeaderList>

            {isLoading ? <Loading /> : 
                <FlatList 
                    data={players}
                    keyExtractor={item => item.name}
                    renderItem={({ item }) => (
                        <PlayerCard name={item.name} onRemove={() => handleRemovePlayer(item.name)} />
                    )}
                    ListEmptyComponent={() => (
                        <ListEmpty message="Não há pessoas nesse time" />
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[{ paddingBottom: 100 }, players.length === 0 && { flex: 1 }]}
                />
            }
            <Button title="Remover Turma" type="SECONDARY" onPress={handleGroupRemove} />
        </Container>
    )
}