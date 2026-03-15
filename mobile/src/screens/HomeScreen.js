import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import axios from 'axios';

const API_URL = 'https://TUO-BACKEND-URL.railway.app/api';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayInterventions();
  }, []);

  const loadTodayInterventions = async () => {
    try {
      const token = await require('@react-native-async-storage/async-storage').default.getItem('token');
      const response = await axios.get(`${API_URL}/tecnici/me/oggi`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterventions(response.data.data);
    } catch (error) {
      console.error('Error loading interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (interventionId) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permesso richiesto', 'Abilita la geolocalizzazione');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const token = await require('@react-native-async-storage/async-storage').default.getItem('token');

      await axios.post(
        `${API_URL}/interventions/${interventionId}/check-in`,
        { lat: location.coords.latitude, lng: location.coords.longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Successo', 'Check-in effettuato!');
      loadTodayInterventions();
    } catch (error) {
      Alert.alert('Errore', error.response?.data?.message || 'Errore check-in');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.client}>{item.client?.ragioneSociale}</Text>
      <Text style={styles.location}>{item.location?.nomeSede}</Text>
      <Text style={styles.type}>{item.tipoIntervento?.nome}</Text>
      
      {item.stato === 'pianificato' && (
        <TouchableOpacity 
          style={styles.checkInButton}
          onPress={() => handleCheckIn(item.id)}
        >
          <Text style={styles.checkInText}>📍 Check-in GPS</Text>
        </TouchableOpacity>
      )}
      
      {item.stato === 'in_corso' && (
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={() => navigation.navigate('Interventi', { screen: 'Detail', params: { id: item.id } })}
        >
          <Text style={styles.completeText}>✓ Completa</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ciao, {user?.nome}!</Text>
      <Text style={styles.subheader}>Interventi di oggi: {interventions.length}</Text>
      
      <FlatList
        data={interventions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nessun intervento per oggi 🎉</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 20, paddingBottom: 5 },
  subheader: { fontSize: 16, color: '#666', paddingHorizontal: 20, paddingBottom: 10 },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  client: { fontSize: 18, fontWeight: 'bold' },
  location: { fontSize: 14, color: '#666', marginTop: 4 },
  type: { fontSize: 14, color: '#3b82f6', marginTop: 4 },
  checkInButton: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  checkInText: { color: '#fff', fontWeight: 'bold' },
  completeButton: { backgroundColor: '#22c55e', padding: 10, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  completeText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#999', marginTop: 50 },
});
