import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

const API_URL = 'https://TUO-BACKEND-URL.railway.app/api';

export default function InterventionsScreen({ navigation }) {
  const [interventions, setInterventions] = useState([]);

  useEffect(() => {
    loadInterventions();
  }, []);

  const loadInterventions = async () => {
    try {
      const token = await require('@react-native-async-storage/async-storage').default.getItem('token');
      const response = await axios.get(`${API_URL}/interventions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInterventions(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (stato) => {
    const colors = {
      completato: '#22c55e',
      in_corso: '#eab308',
      pianificato: '#3b82f6',
    };
    return colors[stato] || '#666';
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={interventions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={[styles.status, { backgroundColor: getStatusColor(item.stato) }]}>
              <Text style={styles.statusText}>{item.stato}</Text>
            </View>
            <Text style={styles.client}>{item.client?.ragioneSociale}</Text>
            <Text style={styles.location}>{item.location?.nomeSede}</Text>
            <Text style={styles.date}>{new Date(item.dataProgrammata).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 10 },
  status: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, marginBottom: 10 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  client: { fontSize: 16, fontWeight: 'bold' },
  location: { fontSize: 14, color: '#666', marginTop: 4 },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
});
