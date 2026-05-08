package com.kanini.springer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SpringerApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringerApplication.class, args);
	}

}

