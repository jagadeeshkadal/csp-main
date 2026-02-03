import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EmailConversation } from './api';

export const exportChatHistoryToPdf = async (
    conversations: EmailConversation[],
    filename: string = 'chat-history',
    userEmail: string = 'User'
) => {

    const doc = new jsPDF();
    let currentY = 20;

    conversations.forEach((conv, index) => {
        if (index > 0) {
            doc.addPage();
            currentY = 20;
        }

        // Header
        doc.setFontSize(22);
        doc.setTextColor(63, 81, 181); // Indigo color for header
        doc.text(`${conv.agent?.name || 'AI Assistant'}`, 14, currentY);
        currentY += 12;

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Subject: ${conv.subject || 'Chat History'}`, 14, currentY);
        currentY += 8;

        doc.setFontSize(10);
        doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, currentY);
        doc.setTextColor(0);
        currentY += 15;

        if (conv.messages && conv.messages.length > 0) {
            // Ensure FIFO message order (Ascending by createdAt)
            const sortedMessages = [...conv.messages].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            const tableData = sortedMessages.map(msg => [
                new Date(msg.createdAt).toLocaleString(),
                msg.senderType === 'user' ? userEmail : (conv.agent?.name || 'Agent'),
                msg.content
            ]);


            autoTable(doc, {
                startY: currentY,
                head: [['Time', 'Sender', 'Message']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [63, 81, 181] },
                columnStyles: {
                    0: { cellWidth: 35 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 'auto' }
                },
                styles: {
                    overflow: 'linebreak',
                    fontSize: 9,
                    cellPadding: 4,
                    valign: 'top'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 250]
                }
            });

            currentY = (doc as any).lastAutoTable.finalY + 20;
        } else {
            doc.text('No messages in this conversation.', 14, currentY);
        }
    });

    doc.save(`${filename}.pdf`);
};
