import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profilo</Text>
      
      <View style={styles.info}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{user?.nome} {user?.cognome}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.label}>Ruolo</Text>
        <Text style={styles.value}>{user?.ruolo}</Text>
      </View>

      <View style={styles.logout}>
        <Button title="Logout" onPress={handleLogout} color="#ef4444" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  info: { marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 5 },
  value: { fontSize: 18, fontWeight: '600' },
  logout: { marginTop: 40 },
});
