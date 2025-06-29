import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { addUserToGroup, findGroupByInviteCode } from '../api/firebase';
import { useAuth } from '../contexts/AuthContext';
import AppButton from './core/AppButton';
import AppTextInput from './core/AppTextInput';

type Props = {
  visible: boolean;
  onClose: () => void;
  onGroupJoined: () => void;
};

export default function JoinGroupModal({ visible, onClose, onGroupJoined }: Props) {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Missing Code', 'Please enter an invite code.');
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const group = await findGroupByInviteCode(inviteCode.trim().toUpperCase());
      if (!group) {
        Alert.alert('Group Not Found', 'No group exists with that code.');
        setIsLoading(false);
        return;
      }
      await addUserToGroup(group.id, user.uid);
      Alert.alert('Success!', `You have joined the group "${group.name}".`);
      onGroupJoined(); // Tell the parent to refresh
      onClose(); // Close this modal
    } catch (error) {
      Alert.alert('Error', 'Could not join group.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Join a Group</Text>
          <AppTextInput
            placeholder="Enter Invite Code"
            value={inviteCode}
            onChangeText={setInviteCode}
            autoCapitalize="characters"
          />
          {isLoading ? (
            <ActivityIndicator />
          ) : (
            <>
              <AppButton title="Join" onPress={handleJoin} />
              <AppButton title="Cancel" onPress={onClose} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'stretch',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});
