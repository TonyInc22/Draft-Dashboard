import java.io.IOException;
//import org.jsoup.Connection;
//import org.jsoup.Jsoup;
//import org.jsoup.nodes.Document;
import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.BufferedWriter;
import java.time.format.DateTimeFormatter;  
import java.time.LocalDateTime;    

//DB Connector import
//Found on C:/XAMPP/HTDOCS/IL/mysql-connector-j-8.1.0.jar
import java.sql.*; 

import java.util.*;

import java.net.*;
import java.io.*;
import java.util.Date;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;


public class ScrapeWeb {

    public static void main(String[] args) throws IOException, URISyntaxException {
        ServerSocket serverSocket = new ServerSocket(8080);
 
        //test_DATABASE();
 
        while(true) {
            listenToClientConnections(serverSocket);
        }
    }
 
 
    private static void listenToClientConnections(ServerSocket serverSocket) throws IOException {
    
    
        System.out.println("\n\n\nListening for connections...");
    
        int testing = 0;
    
        Socket clientSocket = serverSocket.accept();
 
        BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
 
        String requestedResource = "";
        String incomingLineFromClient;
        String usrn = "";
        while ((incomingLineFromClient = in.readLine()) != null) {
            System.out.println("ILFC: "+incomingLineFromClient);
 
            if(incomingLineFromClient.contains("HTTP/1.1")) {
                requestedResource = incomingLineFromClient;
            }
            
            //http://localhost:8080/video=
            if(incomingLineFromClient.contains("?video=")) {
               String[] arrOfStr = incomingLineFromClient.split("/video='");
               String[] arrOfStr2 = arrOfStr[1].split("'");
               usrn = getWebsiteInfo("https://www.youtube.com/results?search_query="+arrOfStr2[0]+"+college+highlights");
               //usrn = getWebsiteInfo("https://www.espn.com/search/_/q/"+arrOfStr2[0]");
               System.out.println("RETURNED: "+usrn.toString());
            }
 
 
            if (incomingLineFromClient.equals(""))
                break;
        }
         PrintWriter out = new PrintWriter(clientSocket.getOutputStream());
         String response = requestedResource;
         String response2 = usrn.toString();
 
           out.print("HTTP/1.1 200 OK\n");
           System.out.println("response: "+response);
           out.print("Content-Length: " + response.length() + "\n");
           out.print("Content-Type: text/html; charset=utf-8\n");
           out.print("Date: Tue, 25 Oct 2016 08:17:59 GMT\n");
           out.print("\n");
           System.out.println("------------> "+response2);
           out.print("this is a test");
           out.flush();
        //}
    }
       public static String getWebsiteInfo(String site_url) throws IOException
   {
      site_url = site_url.replaceAll(" ", "+").toLowerCase();
      System.out.println("------------> "+site_url);
      //site_url = site_url.replaceAll(" ", "+").toLowerCase();
      URL url = new URL(site_url);
      String returnVal = "hi mom";
      URLConnection con = url.openConnection();
      InputStream is = con.getInputStream();
     
      Scanner scan = new Scanner(new InputStreamReader(is));
      String line = null;
         while (scan.hasNextLine()) {
            scan.hasNextLine();
               while(scan.hasNext()) {
                  String s = scan.next();
                  //System.out.println(s);
                  if (s.contains("expandedContent"))
                  {
                     String nextLine = scan.next();
                     String[] arrOfStr4 = nextLine.split("/watch?");
                     System.out.println(arrOfStr4.length);
                     if(arrOfStr4.length > 1) {
                        if(arrOfStr4[1].contains("\"")) {
                           String[] arrOfStr5 = arrOfStr4[1].split("\"");
                              System.out.println("https://youtube.com/watch"+arrOfStr5[0]);
                              returnVal += "https://youtube.com/watch"+arrOfStr5[0]+"";
                        } 
                     } else {
                        return "https://www.youtube.com/watch?v=0t3D7ZCvUWA";
                     }

                     return returnVal;
                  }
               }
         }     
      return returnVal;
   }
}